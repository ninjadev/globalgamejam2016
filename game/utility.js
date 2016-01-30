//various utility functions
module.exports = {
   intersectLineCircle : function(startX, startY, endX, endY, centerX, centerY, radius){
    // http://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm
    var d_x = endX - startX;
    var d_y = endY - startY;

    var f_x = startX - centerX;
    var f_y = startY - centerY;


    var a =  d_x*d_x + d_y * d_y;
    var b = 2 * (f_x*d_x + f_y*d_y);
    var c = (f_x*f_x + f_y*f_y) - radius * radius;

    var discriminant = b*b - 4*a*c;

    if(discriminant < 0){
      //no intersection
      return false;
    }else{
      discriminant = Math.sqrt(discriminant);
      // either solution may be on or off the ray so need to test both
      // t1 is always the smaller value, because BOTH discriminant and
      // a are nonnegative.
      var t1 = (-b - discriminant)/(2*a);
      var t2 = (-b + discriminant)/(2*a);

      // 3x HIT cases:
      //          -o->             --|-->  |            |  --|->
      // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit), 

      // 3x MISS cases:
      //       ->  o                     o ->              | -> |
      // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

      if( t1 >= 0 && t1 <= 1 )
      {
        // t1 is the intersection, and it's closer than t2
        // (since t1 uses -b - discriminant)
        // Impale, Poke
        return true ;
      }

      // here t1 didn't intersect so we are either started
      // inside the sphere or completely past it
      if( t2 >= 0 && t2 <= 1 )
      {
        // ExitWound
        return true ;
      }

      // no intn: FallShort, Past, CompletelyInside
      return false ;
    }

  },
  lineIntersect : function(x1,y1,x2,y2, x3,y3,x4,y4) {
    //http://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function    
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!(x2<=x&&x<=x1)) {return false;}
        } else {
            if (!(x1<=x&&x<=x2)) {return false;}
        }
        if (y1>=y2) {
            if (!(y2<=y&&y<=y1)) {return false;}
        } else {
            if (!(y1<=y&&y<=y2)) {return false;}
        }
        if (x3>=x4) {
            if (!(x4<=x&&x<=x3)) {return false;}
        } else {
            if (!(x3<=x&&x<=x4)) {return false;}
        }
        if (y3>=y4) {
            if (!(y4<=y&&y<=y3)) {return false;}
        } else {
            if (!(y3<=y&&y<=y4)) {return false;}
        }
    }
    return true;
  },
  populate_walls : function(walls, Wall) {
    points = [[414, 433, 
             1521, 446,
             1530, 678,
             1706, 680,
             1713, 782,
             1846, 783,
             1845, 1013,
             1657, 1208,
             1476, 1210,
             1471, 1500,
             377, 1482,
             59, 1104,
             68, 800,
             217, 692,
             410, 691,
             414, 433
             ],
             [520, 517,
             785, 521,
             788, 579,
             658, 728,
             520, 726,
             520, 517
             ],
             [733, 763,
             861, 619,
             950, 615,
             1025, 616
             ],
             [950, 615,
             949, 541,
             ],
             [1109, 556,
             1364, 563,
             1360, 670,
             1228, 786,
             1104, 782,
             1109, 556
             ],
             [416, 822,
             598, 826,
             596, 908,
             483, 908,
             470, 1111,
             318, 1112,
             318, 922,
             416, 822
             ],
             [631, 1018,
             631, 948,
             700, 949
             ],
             [881, 795,
             881, 884
             ],
             [733, 1011,
             860, 1013,
             860, 971
             ],
             [1475, 1055,
             1580, 1057
             ],
             [535, 1196,
             782, 1198,
             781, 1362,
             535, 1359,
             535, 1196
             ],
             [945, 1308,
             943, 1414
             ],
             [1081, 1211,
             1082, 1168,
             1375, 1165,
             1374, 1360,
             1083, 1356,
             1081, 1211,
             889, 1209, 
             888, 1116,
             736, 1114
             ],
             [1031, 881,
             1179, 880
             ],
             [1041, 991,
             1042, 1081
             ],
             [1265, 1077,
             1359, 1079,
             1372, 791,
             1580, 790
             ],
             [1444, 871,
             1573, 876,
             1571, 995,
             1438, 995,
             1444, 871
             ]];
    for(var i = 0; i < points.length; i++) {
        
      for(var j = 0; j < points[i].length; j++) {
        points[i][j] = Math.round( points[i][j] * 64/1920);
      }
      for(var j = 0; j < points[i].length; j += 2) {
        walls.push(new Wall(points[i][j],points[i][j + 1], points[i][j + 2], points[i][j + 3]));
      }
    }
  },
};









