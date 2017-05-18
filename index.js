var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http)
var count = 0
var clients = []


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
})

http.listen(8000, function(){
  console.log('listening on port 8000')
})

function Client(id, name){
  this.id = id
  this.name = name
  this.changeName = function(newName){
    name = newName
  }
}
