const mongoose = require('mongoose');

var StockSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ips: {
    type: [String],
    required:true,
    default: []
  }
});


module.exports = mongoose.model('stock', StockSchema)