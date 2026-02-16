/**
 * SAMPLE ROUTES
 * - description
 */

const express = require('express'); 
const path = require('path'); 
const router = express.Router();

// Controller
const playerController = require('../controllers/playerController');
const championPoolController = require('../controllers/championPoolController');

// GET all players
router.get('/players', playerController.getAllPlayers);

// GET /players/:id [fetch player by ID]
router.get('/players/:id', playerController.getPlayerById);

// Update puuid
router.put('/players/:id/puuid', playerController.updatePuuid);

// GET Champion Pool
router.get('/players/:id/champion_pool', championPoolController.getChampionPool);


// /player_analysis
router.get('/', async function(req, res) {
    res.sendFile(path.join(viewsPath, 'player_analysis.html')); 
});

module.exports = router;