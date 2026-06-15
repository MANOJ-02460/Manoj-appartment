const mongoose = require('mongoose');
const { Schema } = mongoose; 



const MeterReadingSchema = new Schema({
  
  meterId: { type: String, required:true}, //which meter this reading belong to
  
  block:{type: String, required:true},

  previousReading:{type:Number, default:0},

  currentReading:{type:Number, default:0},

  usage:{type:Number, default:0},

  ratePerUnit:{type:Number, default:0}, // {e.g 8.50}
  
  cost:{type:Number, default:0},  // usage * ratePerUnit

  date:{type:Date,default:Date.now},
  
}) 





const ElectricityExpenseSchema = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true, index: true },
  billingMonth: { type: String, index:true}, //"01-08-2025 to 31-08-2025"
  readings: [MeterReadingSchema],
  totalUsage:{type:Number, default:0},  //Kwh  total
  totalCost: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
},{ timestamps:true});


ElectricityExpenseSchema.pre('save', function(next) {
  let totalUsage = 0;
  let totalCost = 0;

  this.readings.forEach(reading => {
    reading.usage = Math.max(0, (reading.currentReading || 0) - (reading.previousReading || 0));

    reading.cost = parseFloat((reading.usage * (reading.ratePerUnit || 0)).toFixed(2));

    totalUsage += reading.usage;
    totalCost  += reading.cost;  
  });


  // Assign totals to parent document
  this.totalUsage = totalUsage;
  this.totalCost  = parseFloat(totalCost.toFixed(2));

  next(); 
})




module.exports = mongoose.model('ElectricityExpense', ElectricityExpenseSchema);
