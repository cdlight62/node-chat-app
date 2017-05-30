var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http)
var count = 0
var clients = []
var serverStart = new Date()

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
})

io.on('connection', function(socket){
  count++
  socket.name = "user" + count
  socket.emit('new user', socket.name, clients)
  socket.broadcast.emit('user status', socket.name, "joined")
  clients.push(new Client(socket.id, socket.name))
  console.log(clients)
  socket.on('disconnect', function(){
    socket.broadcast.emit('user status', socket.name, "left")
    var index = clients.findIndex((obj => obj.name == socket.name))
    clients.splice(index, 1)
    console.log(clients)
  })
  socket.on('username', function(oldName, newName){
    if(clients.findIndex((obj => obj.name == newName))<0){
      io.emit('username', oldName, newName)
      var index = clients.findIndex((obj => obj.name == socket.name))
      clients[index].name = newName
      console.log(clients)
      socket.name = newName
    }
    else{
      socket.emit('name taken', newName)
    }
  })
  socket.on('chat message', function(user, msg){
    socket.broadcast.emit('chat message', user, msg)
  })
  socket.on('typing', function(user, status){
    socket.broadcast.emit('typing', user, status)
  })
  socket.on('whisper', function(user, msg){
    console.log(msg)
    var index = clients.findIndex((obj => obj.name == msg[0]))
    if(index < 0){
      socket.emit('error', 'user "'+msg[0]+'" not found')
    }
    else{
      socket.broadcast.to(clients[index].id).emit('whisper', user, msg[1])
    }
  })
  socket.on('uptime', function(){
    socket.emit('uptime', timeElapsed(serverStart))
  })
})

http.listen(8000, function(){
  console.log('listening on port 8000, ' + serverStart)
})

function timeElapsed(start){
  var today = new Date()
  var years = today.getFullYear() - start.getFullYear()
  var months = today.getMonth() - start.getMonth()
  var days = today.getDate() - start.getDate()
  var hours = today.getHours() - start.getHours()
  var minutes = today.getMinutes() - start.getMinutes()
  var seconds = today.getSeconds() - start.getSeconds()
  if(minutes < 0){
    hours -= 1
    minutes += 60
  }
  if(hours < 0){
    days -= 1
    hours += 24
  }
  if(days < 0){
    months -= 1
    days = today.getDate() + (daysInMonth(start.getMonth() + 1, start.getFullYear()) - start.getDate())
  }
  if(months < 0){
    years -= 1
    months += 12
  }
  var uptime = "The server has been up for "
  count = 0
  if(years > 0){
    uptime += pluralize(years, "year")
    count ++
  }
  if(months > 0){
    uptime += pluralize(months, "month")
    count ++
  }
  if(days > 0){
    uptime += pluralize(days, "day")
    count ++
  }
  if(hours > 0 && count < 3){
    uptime += pluralize(hours, "hour")
    count ++
  }
  if(minutes > 0 && count < 3){
    uptime += pluralize(minutes, "minute")
    count ++
  }
  if(count === 0){
    uptime += pluralize(seconds, "second")
  }
  return uptime
}

function daysInMonth(month, year){
  return new Date(year, month, 0).getDate()
}

function pluralize(num, str){
  if(num > 1){
    str += "s"
  }
  return num + " " + str + " "
}

function Client(id, name){
  this.id = id
  this.name = name
  this.changeName = function(newName){
    name = newName
  }
}
