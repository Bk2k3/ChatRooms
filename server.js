const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');


const botName = 'ChatRooms';
const app = express();
const server = http.createServer(app);
const io = socketio(server);


//Static folder setup
app.use(express.static(path.join(__dirname, 'public')));

//Run when client connnects
io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

    //welcome a new user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatRooms!'));

    //broadcasts 
    //new connection
    socket.broadcast
    .to(user.room)
    .emit('message', formatMessage(botName, `${user.username} has joined the chat`));
    
    //send users n room info
    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
    });
    });

    // listen for chats
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        // emit to everyone in the room
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
        io.to(user.room).emit(
            'message', 
            formatMessage(botName,`${user.username} has left the chat`)
        );

        //send users n room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

        }
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
