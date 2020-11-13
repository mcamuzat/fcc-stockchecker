/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

const CONNECTION_STRING = process.env.MONGO_URI;
const Stock = require('../models/stock.js');
const mongoose = require('mongoose')
const fetch = require("node-fetch");

module.exports = function (app) {
  mongoose.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });

  app.route('/api/stock-prices')
    .get(function (req, res){
      var stock = req.query.stock;
      var like = req.query.like||false;
      // get ip
      var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress).split(",")[0];
      
      if (Array.isArray(stock)) {
          let stockData = Promise.all([
            getStockPriceAndUpdate(stock[0],like,ip),
            getStockPriceAndUpdate(stock[1],like,ip)
          ]).then((stockData) => {
            stockData[0].rel_likes = stockData[0].likes - stockData[1].likes;
            stockData[1].rel_likes = stockData[1].likes - stockData[0].likes;
            delete stockData[0].likes;
            delete stockData[1].likes;
            return res.json({stockData});
          })
      } else {
        getStockPriceAndUpdate(stock,like,ip).then((stockData) => res.json({stockData}));

      }  

      
    });
    
    async function getStockPriceAndUpdate(stock,like,ip) {
      var response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`);
      let data = await response.json();
      stock = stock.toUpperCase();
      // create line or get it if not exist
      let result = await Stock.findOneAndUpdate(
          {name: stock}, 
          {name: stock},
          { upsert: true, new: true }).exec();
      // add like
      if (like && !result.ips.includes(ip)) {
          result = await Stock.findByIdAndUpdate(
                result._id,
                {$push: { ips: ip }},{new: true }
          );
      }
      return {price: data.latestPrice, stock:stock, likes:result.ips.length}
    }
};
