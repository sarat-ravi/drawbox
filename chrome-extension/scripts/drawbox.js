var users = {};

var drawbox = {
    addUser: function(userId, fullName, pathColor) {
        users[userId] = {
            "paths": [],
            "cursorShape": false,
            "fullName": fullName,
            "pathColor": pathColor
        }
    },

    moveCursor: function(userId, x, y) {
        var user = users[userId];
        var cursorShape = user.cursorShape;

        if (cursorShape) {
            cursorShape.remove();
        }

        var radius = 5;
        cursorShape = new paper.Shape.Circle(new paper.Point(x,y), radius);
        cursorShape.strokeColor = user.pathColor; 
        cursorShape.fillColor = user.pathColor;
        user.cursorShape = cursorShape;
    },

    // Start a new path for a user.
    startPath: function(userId, x, y) {
        var user = users[userId];
        var paths = user.paths;
        var pathColor = user.pathColor;
        var path = new paper.Path({ segments: [new paper.Point(x, y)], strokeColor: pathColor, fullySelected: false });
        paths.push(path);    
    },

    // Continue the path from the previous point to the new point.
    drawPath: function(userId, x, y) {
        var paths = users[userId].paths; 
        var path = paths[paths.length - 1];
        path.add(new paper.Point(x, y)); 
    },

    // Commits the path by simplifying it.
    commitPath: function(userId) {
        var paths = users[userId].paths; 
        var path = paths[paths.length - 1];
        path.simplify(10);
    }
};


console.log("drawbox loaded");
