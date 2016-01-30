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
};

