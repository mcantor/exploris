var GameMap = Class.extend('GameMap', {
    initialize: function() {
        this.width = GAME_MAP_WIDTH;
        this.height = GAME_MAP_HEIGHT;
        this.data = Cell.createCellTable(this.width, this.height);
    },

    positionOutOfBounds: function(pos) {
        return (pos.x < 0 || pos.x > this.width ||
                pos.y < 0 || pos.y > this.height);
    },

    get: function(position) {
        return this.data[position.y][position.x];
    },

    getRandomDirection: function() {
        return ['left','right','up','down'][getRandomInt(0, 4)];
    },

    positionChanges: {
        'left': [-1, 0],
        'right': [1, 0],
        'up': [0, -1],
        'down': [0, 1]
    },

    calculateNewPosition: function(position, change) {
        return {
            x: position.x + change[0],
            y: position.y + change[1]
        };
    },

    getMoveCell: function(cell, dir) {
        var change = this.positionChanges[dir];
        var newPos = this.calculateNewPosition(cell.position, change);
        if (this.positionOutOfBounds(newPos)) { return false; }
        return this.get(newPos);
    },

    placeCreature: function(creature, position) {
        var cell = this.get(position);
        creature.cell = cell;
        creature.cell.creatureEnter(creature);
    },

    drawRiver: function(start, path) {
        var position = {x: start.x, y: start.y};

        path.forEach(function(step) {
            ({
                'r': function(){ position.y++; },
                'u': function(){ position.x--; },
                'l': function(){ position.y--; },
                'd': function(){ position.x++; }
            })[step]();
            this.get(position).addItem(Water.create());
        }.bind(this));
    }
});

var Cell = Class.extend('Cell', {
    initialize: function(x, y) {
        this.position = {x: x, y: y};
        this.contents = [];
    },

    createCellTable: function(width, height) {
        var data = [];
        for (var y = 0; y < height; y++) {
            var row = [];
            for (var x = 0; x < width; x++) {
                row.push(Cell.create(x, y));
            }
            data.push(row);
        }
        return data;
    },

    creatureEnter: function(creature) {
        this.element.classList.add(creature.creatureType);
    },

    creatureLeave: function(creature) {
        this.element.classList.remove(creature.creatureType);
    },

    addItem: function(item) {
        this.contents.push(item)
        this.element.classList.add(item.itemType);
    },

    removeItem: function(item) {
        var index = this.contents.indexOf(item);
        this.contents.splice(index, 1)
        this.element.classList.remove(item.itemType);
    },

    popItem: function() {
        var item = this.contents[0];
        if (typeof(item) === 'undefined') {
            return null;
        }
        this.removeItem(item);
        return item;
    },

    isPassable: function() {
        for (var i = 0; i < this.contents.length; i++) {
            if (this.contents[i].impassable) {
                return false;
            }
        };
        return true;
    },

    hasDoor: function() {
        for (var i = 0; i < this.contents.length; i++) {
            if (this.contents[i].itemType == 'wood-door') {
                return true;
            }
        };
        return false;
    }

});

var Game = Class.extend('Game', {
    initialize: function(htmlView) {
        this.view = htmlView;
        this.map = GameMap.create();
        this.player = Player.create(this.view);
        this.creatures = [];
    },

    start: function() {
        this.view.initializeMap(this.map.data);
        this.initializeCreatures();
    },

    initializeCreatures: function() {
        this.map.placeCreature(this.player, PLAYER_START_POSITION);

        // initialize creature(s)
        var ammonite = Ammonite.create(this.view);
        this.map.placeCreature(ammonite, ammonitePos);
        setInterval(function() {
            var dir = this.map.getRandomDirection();
            this.tryCreatureMove(ammonite, dir);
        }.bind(this), 1500);
    },

    tryCreatureMove: function(creature, dir) {
        var newCell = this.map.getMoveCell(creature.cell, dir);
        if (newCell) {
            if (this.creatureCanEnterCell(creature, newCell)) {
                creature.move(newCell);
            }
        }
    },

    creatureCanEnterCell: function(creature, cell) {
        if (!cell.isPassable()) { return false; }
        if (cell.hasDoor() && !creature.canOperateDoors) { return false; }
        return true;
    }
});
