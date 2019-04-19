var express = require('express');
var app = express();
var serv = require ('http').Server(app);

app.get('/',function(req, res){
  res.sendFile(__dirname + '/client/index.html');
})
app.use('/client', express.static(__dirname + '/client'));
serv.listen (8001);
console.log(`empezamos letsgo`)
console.log('puerto 8001')


var SOCKET_LIST = {};
var PLAYER_LIST = {};
var BARAJA = {} //yo lo rellenaría aquí mismo, es un valor constante

var Player = function(id){
	var self = {
		id = id;
		money = 0;
		personaje = "";
		distritos = [];
		mano = [];
		turno = false;
	}
	return self;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id=Math.random();
	SOCKET_LIST[socket.id]=socket;

	var player = Player(socket.id);
	PLAYER_LIST =[socket.id] = player;

	if (SOCKET_LIST.length == 4) {
	    socket.emit('serverMsg',{
	        msg:'empezamos partida lets go'
	    });

	    barajar(BARAJA);

	    for (var i in PLAYER_LIST) {
	    	i.money += 2;
	    	var rand = myArray[Math.floor(Math.random() * myArray.length)];
	    	for (var j=0; j<4; j++) {
	    		i.hand.push(PLAYER_LIST.pop());
	    	}
	    }
	}


    console.log('socket connection');

    socket.on('disconnect',function(data){
    	delete SOCKET_LIST[socket.id];
    	delete PLAYER_LIST[socket.id];
    	socket.emit('severMsg', {
    		msg:'Un men se ha desconectado. Fin del juego.'
    	})

    });

    socket.emit('serverMsg',{
        msg:'hello',
    });

});

// Función para barajar las cartas
function barajar(arra1) {
    let ctr = arra1.length;
    let temp;
    let index;

    // While there are elements in the array
    while (ctr > 0) {
// Pick a random index
        index = Math.floor(Math.random() * ctr);
// Decrease ctr by 1
        ctr--;
// And swap the last element with it
        temp = arra1[ctr];
        arra1[ctr] = arra1[index];
        arra1[index] = temp;
    }
    return arra1;
}


var Entity = function(){
	var self = {
		x:250,
		y:250,
		spdX:0,
		spdY:0,
		id:"",
	}
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
	}
	self.getDistance = function(pt){
		return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
	}
	return self;
}


Player.list = {};
Player.onConnect = function(socket){
	var player = Player(socket.id);
	socket.on('keyPress',function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
		else if(data.inputId === 'attack')
			player.pressingAttack = data.state;
		else if(data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
	});
}
Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}
Player.update = function(){
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push({
			id:player.id,
			x:player.x,
			y:player.y,
		});
	}
	return pack;
}


var Bullet = function(parent,angle){
	var self = Entity();
	self.id = Math.random();
	self.spdX = Math.cos(angle/180*Math.PI) * 10;
	self.spdY = Math.sin(angle/180*Math.PI) * 10;
	self.parent = parent;
	self.timer = 0;
	self.toRemove = false;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();

		for(var i in Player.list){
			var p = Player.list[i];
			if(self.getDistance(p) < 32 && self.parent !== p.id){
				//handle collision. ex: hp--;
				self.toRemove = true;
			}
		}
	}
	Bullet.list[self.id] = self;
	initPack.bullet.push({
		id:self.id,
		x:self.x,
		y:self.y,
	});
	return self;
}
Bullet.list = {};

Bullet.update = function(){
	var pack = [];
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove){
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
		} else
			pack.push({
				id:bullet.id,
				x:bullet.x,
				y:bullet.y,
			});
	}
	return pack;
}



var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};


setInterval(function(){
	var pack = {
		player:Player.update(),
		bullet:Bullet.update(),
	}

	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('remove',removePack);
	}
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];

},1000/25);
/*
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    console.log('socket connection');

    socket.on('happy',function(data){
        console.log('happy because ' + data.reason);
    });

    socket.emit('serverMsg',{
        msg:'hello',
    });

});



/*
//#con http va k
const http = require('http')

const port = 8001

const requestHandler = (request, response) => {
  console.log(request.url)
  response.end('Hello Node.js Server!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})*/
