const request = require('request')
const stem = 'https://deckofcardsapi.com/api/deck/'

function getCards (callback) {
  request.get(stem + 'new/shuffle/?deck_count=1', (err, res, body) => {
    const deck_id = JSON.parse(body).deck_id
    request.get(stem + deck_id + '/draw/?count=52', (err2, res2, body2) => {
      callback(JSON.parse(body2).cards)
    })
  })
}

exports.getStartingHands = (callback) => {
  getCards((hands) => {
    callback([
      hands.slice(0, 26),
      hands.slice(26, 52)
    ])
  })
}
