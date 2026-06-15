const mongoose = require('mongoose');
const WaterExpense = require('../Models/WaterExpense');
const Apartment = require('../Models/apartments');
const MaintenanceExpense = require('../Models/MaintenanceExpense');
const { recalculateMaintenanceHelper } = require('./maintenanceExpenseController');

const computeListTotals = (list) => {
  let totalTankers = 0, totalLitres = 0, totalCost = 0;
  if (!Array.isArray(list)) return { totalTankers, totalLitres, totalCost };
  list.forEach(item => {
    const tankers = Number(item.tankers) || 0;
    const capacity = Number(item.capacity) || 0;
    const perLiterCost = Number(item.perLiterCost) || 0;
    const litres = tankers * capacity;
    const cost = litres * perLiterCost;
    item.totalLitres = litres;
    item.totalCost = cost;
    totalTankers += tankers;
    totalLitres += litres;
    totalCost += cost;
  });
  return { totalTankers, totalLitres, totalCost };
};

exports.createWaterExpense = async (req, res) => {
  try {
    const { apartmentId, month, bore = [], manjeera = [], createdBy } = req.body;
    if (!apartmentId) return res.status(400).json({ message: 'apartmentId required' });
    if (!month) return res.status(400).json({ message: 'month required' });

    // compute totals for both lists
    const boreTotals = computeListTotals(bore);
    const manjeeraTotals = computeListTotals(manjeera);

    const totalTankers = boreTotals.totalTankers + manjeeraTotals.totalTankers;
    const totalLitres = boreTotals.totalLitres + manjeeraTotals.totalLitres;
    const totalCost = boreTotals.totalCost + manjeeraTotals.totalCost;
    const ratePerLitre = totalLitres > 0 ? +(totalCost / totalLitres).toFixed(4) : 0;

    const record = new WaterExpense({
      apartmentId,
      month,
      totalTankers,
      totalLitres,
      totalCost,
      ratePerLitre,
      bore,
      manjeera,
      createdBy
    });

    await record.save();
    return res.status(201).json({ message: 'created', waterExpense: record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllWaterExpenses = async (req, res) => {
  try {
    const { apartmentId, month } = req.query;
    const query = {};
    if (apartmentId) query.apartmentId = apartmentId;
    if (month) query.month = month;

    const records = await WaterExpense.find(query)
      .populate('apartmentId', 'name')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('Error fetching water expenses:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.getWaterExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await WaterExpense.findById(id).populate('apartmentId', 'name');
    if (!record) return res.status(404).json({ message: 'Water expense not found' });

    res.json(record);
  } catch (error) {
    console.error('Error fetching water expense:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.updateWaterExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { bore = [], manjeera = [] } = req.body;

    const existing = await WaterExpense.findById(id);
    if (!existing) return res.status(404).json({ message: 'not found' });

    // Helper: update or add tanker
    const updateList = (existingList, newList) => {
      newList.forEach(item => {
        if (item._id) {
          // UPDATE existing tanker
          const index = existingList.findIndex(t => t._id.toString() === item._id);
          if (index !== -1) {
            existingList[index] = { ...existingList[index]._doc, ...item };
          }
        } else {
          // ADD new tanker
          existingList.push(item);
        }
      });
    };

    updateList(existing.bore, bore);
    updateList(existing.manjeera, manjeera);

    // Recompute totals
    const boreTotals = computeListTotals(existing.bore);
    const manjeeraTotals = computeListTotals(existing.manjeera);

    existing.totalTankers = boreTotals.totalTankers + manjeeraTotals.totalTankers;
    existing.totalLitres = boreTotals.totalLitres + manjeeraTotals.totalLitres;
    existing.totalCost = boreTotals.totalCost + manjeeraTotals.totalCost;
    existing.ratePerLitre =
      existing.totalLitres > 0
        ? +(existing.totalCost / existing.totalLitres).toFixed(4)
        : 0;

    await existing.save();

    // 🌟 CASCADE UPDATE: Auto-sync linked maintenance bills!
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const linkedMaintenance = await MaintenanceExpense.findOne({ waterExpenseId: id }).session(session);
      if (linkedMaintenance) {
        await recalculateMaintenanceHelper(linkedMaintenance._id, session);
      }
      await session.commitTransaction();
    } catch (calcError) {
      console.error("Cascade recalculation error:", calcError);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }

    res.json({ message: "updated", waterExpense: existing });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


exports.deleteWaterExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await WaterExpense.findByIdAndDelete(id);

    if (!record) return res.status(404).json({ message: 'Water expense not found' });

    // Cascade deletion: Remove water charges from any linked Maintenance Bill
    const MaintenanceExpense = require('../Models/MaintenanceExpense');
    const linkedMaintenance = await MaintenanceExpense.findOne({ waterExpenseId: id });
    
    if (linkedMaintenance) {
      let totalWaterRemoved = 0;
      linkedMaintenance.flatExpenses.forEach(f => {
        const flatWaterTotal = (f.waterCost || 0) + (f.commonWater || 0);
        totalWaterRemoved += flatWaterTotal;
        f.total = +(f.total - flatWaterTotal).toFixed(2);
        f.waterCost = 0;
        f.commonWater = 0;
        f.ratePerLiter = 0;
        f.consumedLiters = 0;
      });
      linkedMaintenance.totalMaintenance = +(linkedMaintenance.totalMaintenance - totalWaterRemoved).toFixed(2);
      linkedMaintenance.totalCommonWaterCost = 0;
      linkedMaintenance.waterExpenseId = null;
      await linkedMaintenance.save();
    }

    res.json({ message: 'Water expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting water expense:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

exports.deleteSingleTanker = async (req, res) => {
  try {
    const { expenseId, type, tankerId } = req.params;

    if (!['bore', 'manjeera'].includes(type)) {
      return res.status(400).json({ message: 'Invalid tanker type. Must be "bore" or "manjeera".' });
    }

    // Find the record
    const record = await WaterExpense.findById(expenseId);
    if (!record) return res.status(404).json({ message: 'Water expense not found' });

    // Find the tanker array and remove the selected one
    const index = record[type].findIndex(t => t._id.toString() === tankerId);
    if (index === -1) {
      return res.status(404).json({ message: `${type} tanker not found` });
    }

    // Remove the tanker
    record[type].splice(index, 1);

    // Recalculate totals
    const calculateTotals = (list) => {
      let totalTankers = 0, totalLitres = 0, totalCost = 0;
      list.forEach(item => {
        const t = Number(item.tankers) || 0;
        const c = Number(item.capacity) || 0;
        const plc = Number(item.perLiterCost) || Number(item.perLiterCost === 0 ? 0 : item.perLiterCost) || 0;
        const litres = t * c;
        const cost = litres * plc;
        totalTankers += t;
        totalLitres += litres;
        totalCost += cost;
        item.totalLitres = litres;
        item.totalCost = cost;
      });
      return { totalTankers, totalLitres, totalCost };
    };

    const boreTotals = calculateTotals(record.bore);
    const manjeeraTotals = calculateTotals(record.manjeera);

    record.totalTankers = boreTotals.totalTankers + manjeeraTotals.totalTankers;
    record.totalLitres = boreTotals.totalLitres + manjeeraTotals.totalLitres;
    record.totalCost = boreTotals.totalCost + manjeeraTotals.totalCost;
    record.ratePerLitre = record.totalLitres > 0 ? +(record.totalCost / record.totalLitres).toFixed(4) : 0;

    await record.save();

    res.json({
      message: `Deleted one ${type} tanker successfully`,
      waterExpense: record,
    });
  } catch (error) {
    console.error('Error deleting tanker:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// NEW: Aggregate date-wise combined for frontend (query param)
exports.getApartmentDateWise = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    if (!apartmentId) return res.status(400).json({ message: 'apartmentId required' });

    const records = await WaterExpense.find({ apartmentId }).sort({ createdAt: -1 }).lean();

    const dateMap = {};
    records.forEach(rec => {
      const addList = (list, type) => {
        (list || []).forEach(t => {
          const dateKey = new Date(t.date).toISOString().slice(0,10); // YYYY-MM-DD
          if (!dateMap[dateKey]) {
            dateMap[dateKey] = {
              date: dateKey,
              boreTankers: 0,
              boreLitres: 0,
              boreCost: 0,
              manjeeraTankers: 0,
              manjeeraLitres: 0,
              manjeeraCost: 0,
            };
          }
          if (type === 'bore') {
            dateMap[dateKey].boreTankers += Number(t.tankers) || 0;
            dateMap[dateKey].boreLitres += Number(t.totalLitres) || (Number(t.tankers || 0) * Number(t.capacity || 0));
            dateMap[dateKey].boreCost += Number(t.totalCost) || 0;
          } else {
            dateMap[dateKey].manjeeraTankers += Number(t.tankers) || 0;
            dateMap[dateKey].manjeeraLitres += Number(t.totalLitres) || (Number(t.tankers || 0) * Number(t.capacity || 0));
            dateMap[dateKey].manjeeraCost += Number(t.totalCost) || 0;
          }
        });
      };
      addList(rec.bore, 'bore');
      addList(rec.manjeera, 'manjeera');
    });

    const dateWise = Object.values(dateMap).map(d => ({
      date: d.date,
      boreTankers: d.boreTankers,
      boreCapacity: d.boreLitres,
      boreCost: d.boreCost,
      manjeeraTankers: d.manjeeraTankers,
      manjeeraCapacity: d.manjeeraLitres,
      manjeeraCost: d.manjeeraCost,
      totalTankers: +(d.boreTankers + d.manjeeraTankers),
      totalConsumed: +(d.boreLitres + d.manjeeraLitres),
      totalCost: +(d.boreCost + d.manjeeraCost)
    }));

    return res.json({ dateWise, totals: records.length ? {
      totalTankers: records.reduce((acc, r) => acc + (r.totalTankers||0), 0),
      totalLitres: records.reduce((acc, r) => acc + (r.totalLitres||0), 0),
      totalCost: records.reduce((acc, r) => acc + (r.totalCost||0), 0)
    } : { totalTankers:0, totalLitres:0, totalCost:0 }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
