const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
  apartmentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Apartment', 
    required: true,
    index: true 
  },
  category: { 
    type: String, 
    required: true, 
    trim: true 
  },
  expenseDate: { 
    type: Date, 
    required: true 
  },
  vendor: { 
    type: String, 
    trim: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  attachmentUrl: { 
    type: String, 
    trim: true 
  },
  notes: { 
    type: String, 
    trim: true 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

// Compound index to optimize filtering by apartment and sorting by date
ExpenseSchema.index({ apartmentId: 1, expenseDate: -1 });

module.exports = mongoose.model('Expense', ExpenseSchema);
