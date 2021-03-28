const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const mongoose = require('mongoose');

//db connection
mongoose.connect(
	process.env.MLAB_URI,
	{ useNewUrlParser: true, useUnifiedTopology: true }
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log('connected yay');
});


//parse req.body data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


//define schemas and models
const unitSchema = new mongoose.Schema({
	unitType: {type: String, default: "new_type" },
  units: [{
    description: { type: String, default: "new_unit" },
    magnitude: { type: Number, default: 1 },
  }]
});
// "myData10" becomes "unitData"
const unitData = mongoose.model('unitData', unitSchema);





//some initial output
/*myData10.find()
    .select('username _id')
    .exec(function(err, data) {
			console.log(data);
});*/


app.get('/api/exercise/users', function(req, res) {
  console.log("method:" , req.method)
  console.log("path: /api/exercise/users")
  
	myData10.find(function(err, data) {
		let result = []
		for (let i = 0; i < data.length; i++) {
			result[i] = {};
			result[i]._id = data[i]._id;
      //result[i].userId = data[i]._id;
			result[i].username = data[i].username;
      result[i].exercises = [...data[i].exercises]
		}
		console.log(result);
		res.json(result);
	});
});




app.post('/units', function(req, res) {
  console.log("method: " , req.method)
  console.log("path: /units")
  console.log("req.body: " , req.body)

	let result = {};

	const datum1 = new unitData({
    unitType: req.body.type || undefined,
    units: {
      description: undefined,
      magnitude: undefined,
    } // there's probably no need to add an initial default exercise
  })

	datum1.save(function(err, data) {
		console.log('saved');

  // output
		unitData.find({_id: data._id})
    .select('-__v')
    .exec(function(err, data) {
      console.log(data[0]);
		  res.json(data[0]);
		});
	});
});





app.post('/addUnits', function(req, res) {
  console.log("method: " , req.method)
  console.log("path: /addUnits")
  console.log("req.body: " , req.body)

  unitData.find({unitType: req.body.addType})
  .select('-__v')
  .exec(function(err, data) {
    
    res.json(data.length)
    //console.log()

    if ( data.length > 0 ) {  // if there is a unit with this type (should be just one)
    }

    const datum1 = new unitData({
      unitType: req.body.addType
    })
    datum1.save()

  });



    
});





















app.post("/api/exercise/add", function(req, res){
  console.log("method: " , req.method)
  console.log("path: /api/exercise/add")  
  console.log("req.body: " , req.body)

  if ( !req.body.userId ) {
    myData10.find(function(err,data){
       
      let lastIndex = data.length-1
      let lastObject = new myData10(data[lastIndex])
      
      console.log("no ID provided, adding to the last one -" , lastObject._id)

      add(lastObject._id)
    })
  } else {

    add(req.body.userId)
  }
 
  function add(id){
    
    myData10.findById(id, function(err, data1){

      //console.log(data1)

      let exercise = {
        description: req.body.description || undefined,
        duration: req.body.duration || undefined,
      }
      if (req.body.date) {
        exercise.date = new Date(req.body.date).toDateString()
      } else {
        exercise.date = undefined
      }

      data1.exercises.push(exercise)

      
        //console.log(data1.exercises)

      data1.save(function(err, data){

        myData10.find({_id: data1._id})
        .exec(function(err, data) {

          let ex = data[0].exercises[data[0].exercises.length-1]  //the last one
          let result = {
            _id: data[0]._id,
            //userId: data[0]._id,
            username: data[0].username,
            description: ex.description,
            duration: ex.duration,
            date: ex.date
          }

          console.log(result)
          //console.log(req.status, res.status())
          res.json(result)


        })
        
      })
    })
  
  }

})




app.post("/api/exercise/log", function(req, res){

  console.log("method: " , req.method)
  console.log("path: /api/exercise/log/")  
  console.log("req.query: " , req.body)
  
  if (!req.body._id ) {
    let errMsg = "missing ID"

    console.log(errMsg)
    console.log("existing IDs:")
    myData10.find()
    .select('username _id')
    .exec(function(err, data) {
			console.log(data);
    })

    res.json(errMsg)

  } else {
    log()
    //myData10.findById(req.body._id)
    //.exec(function(err, data){
    //  console.log(data, err)
    //)
  }

  function log (){
    
    myData10.findById(req.body._id)
    .exec(function(err, data){

      if (!data) {
        let errMsg = "invalid ID" 
        console.log(errMsg)
        res.json(errMsg)
        return
      }

      //console.log(req.body.from, req.body.to, req.body.limit)

      let resultTemp = []
      let result = {}

      let startD = new Date(req.body.from)
      let endD = new Date(req.body.to)

      let fromOk  =  startD != "Invalid Date"
      let toOk  =  endD != "Invalid Date"

      let size = 0
      let limit = Number(req.body.limit)   // make sure it's a number

      //console.log(resultTemp , startD, endD, size, limit)

      //filter according to 'from' and 'to'
      for ( let i=0; i<data.exercises.length; i++ ){

        let date = data.exercises[i].date
        let ex = data.exercises[i]

        if ( fromOk  &&  !toOk ) {
          if ( date > startD ) {
            resultTemp.push(ex)
          }
        } else if ( !fromOk  &&  toOk ) { 
          if ( date < endD ) {
            resultTemp.push(ex)
          }
        } else if ( fromOk  &&  toOk) {
          if ( date>startD && date<endD ) {
            resultTemp.push(ex)
          }
        } else if ( !fromOk  &&  !toOk ) {
          resultTemp.push(ex)
        }
        //console.log(data.exercises[i].date - data.exercises[i+1].date)
      }
      size = resultTemp.length
      //console.log(resultTemp)

      //sort ascending
      resultTemp.sort((a,b)=>a.date-b.date)
      //console.log(resultTemp)

      //limit from 0th to 'limit'th
      let resultTemp2 = []
      if ( !!limit ) {    // if valid
        for ( let i=0; i<limit; i++ ){
          resultTemp2.push(resultTemp[i])
        }
        size = resultTemp2.length
      } else {          // if empty or invalid
        resultTemp2 = [...resultTemp]
      }

      

      //myData10.find({_id: data._id})
      //.select('-_id -__v -exercises._id')
      //.exec(function(err, data) {

        result = {
          username: data.username,
          exercises: [...resultTemp2],
          count: size
        }
        
        console.log(result)
        res.json(result)
      //})

    })
  
  }

})


app.get("/api/exercise/log", function(req, res){
  //https://boilerplate-project-exercisetracker-2.d78mdd.repl.co/api/exercise/log?{userId}[&from][&to][&limit]
  
  //https://boilerplate-project-exercisetracker-2.d78mdd.repl.co/api/exercise/log?userId=5f90549c49fad607102d57f4
  //https://boilerplate-project-exercisetracker-2.d78mdd.repl.co/api/exercise/log?userId=5f90549c49fad607102d57f4&from=2017-01-01&to=2019-12-12

  console.log("method: " , req.method)
  console.log("path: /api/exercise/log/")  
  console.log("req.query: " , req.query)

  if (!req.query.userId ) {
    let errMsg = "missing ID"

    console.log(errMsg)
    console.log("existing IDs:")
    myData10.find()
    .select('username _id')
    .exec(function(err, data) {
			console.log(data);
    })

    res.json(errMsg)

  } else {
    log()
  }


  function log (){
    
    myData10.findById(req.query.userId)
    .exec(function(err, data){

      if (!data) {
        let errMsg = "invalid ID" 
        console.log(errMsg)
        res.json(errMsg)
        return
      }

      //console.log(req.query.from, req.query.to, req.query.limit)

      let resultTemp = []
      //let result = []
      let result

      let startD = new Date(req.query.from)
      let endD = new Date(req.query.to)

      let fromOk  =  startD != "Invalid Date"
      let toOk  =  endD != "Invalid Date"

      let size = 0
      let limit = Number(req.query.limit)   // make sure it's a number

      //console.log(resultTemp , startD, endD, size, limit)
      //console.log(fromOk , toOk)

      //filter according to 'from' and 'to'
      for ( let i=0; i<data.exercises.length; i++ ){

        let date = data.exercises[i].date
        let ex = data.exercises[i]

        if ( fromOk  &&  !toOk ) {
          if ( date > startD ) {
            resultTemp.push(ex)
          }
        } else if ( !fromOk  &&  toOk ) { 
          if ( date < endD ) {
            resultTemp.push(ex)
          }
        } else if ( fromOk  &&  toOk) {
          if ( date>startD && date<endD ) {
            resultTemp.push(ex)
            //console.log(ex)
          }
        } else if ( !fromOk  &&  !toOk ) {
          resultTemp.push(ex)
        }
        //console.log (date>startD, date<endD)
        //console.log(ex)
        //console.log(data.exercises[i].date - data.exercises[i+1].date)
      }
      size = resultTemp.length
      //console.log(resultTemp)

      //sort ascending
      resultTemp.sort((a,b)=>a.date-b.date)
      //console.log(resultTemp)

      //limit from 0th to 'limit'th
      let resultTemp2 = []
      if ( !!limit ) {    // if valid
        for ( let i=0; i<limit; i++ ){
          resultTemp2.push(resultTemp[i])
        }
        size = resultTemp2.length
      } else {          // if empty or invalid
        resultTemp2 = [...resultTemp]
      }


      result = []
      //result.push({
      //  username: data.username,
      //  exercises: [...resultTemp2],
      //  count: data.exercises.length
      //})
      result.push({   //nonsense
        _id: data._id,
        username: data.username,
        description: data.exercises[0].description,
        duration: data.exercises[0].duration,
        date: data.exercises[0].date
      })
        
      console.log(result)
      res.json(result)

    })
  
  }

 
})





// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('app listening on ' + listener.address().port);
});




/*
  TODO

  todo2
    make checks for limit, from, to


  alter my schema adding and _id or userId ??
*/