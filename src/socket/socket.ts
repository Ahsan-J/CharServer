import http from 'http';
import socketIO from 'socket.io';
import _ from 'lodash';
import Router from '@koa/router';
import { IApiResponse, IChatMessageRecord } from '../helpers/types';
import UserSocket from '../aws/UserSocket';
import ChatMessage from '../aws/ChatMessages';
import { isRead, setRead, setUnread, unsetUnread } from '../helpers/chatStatus';

const router = new Router();
let client: socketIO.Namespace;
let io: socketIO.Server;

export const connectWithSocket = (appCallback: http.RequestListener): http.Server => {
  const serverWithSocket = http.createServer(appCallback)
  io = socketIO(serverWithSocket, { transports: ['websocket'], pingTimeout: 5000 })

  client = io.of(/^\/socketid-[+@_A-Za-z0-9\\-]+$/);

  client.on('connection', async socket => {
    const phId = _.split(socket.nsp.name, '-')[1];
    
    if (phId == socket.handshake.query.myNumber) {
      UserSocket.createRecord({userId: phId, socketId: socket.id}).catch(err => console.log(err));
    }

    socket.on('disconnect', () => {
      // delete socket bindings to clean database
      UserSocket.deleteRecord({userId: phId}).catch(err => console.log(err));
    })

    // send all the stored messages via socket
    const messages = await ChatMessage.getRecordsByReceiverId({receiverId: phId, status: setUnread()})
    if (messages.Items) {
      _.forEach(messages.Items, message => {
        if(isRead(parseInt(message.status.S || "0"))) {
          return
        }
        const data : IChatMessageRecord = {
          senderId: message.senderId.S || "",
          receiverId: message.receiverId.S || "",
          id: message.id.S || "",
          message: message.message.S || "",
          time : message.time.S || "",
          status: parseInt(message.status.S || "0"),
        }

        client.to(socket.id).emit('chat-message', data);
        ChatMessage.createRecord({
          id: message.id.S,
          receiverId: message.receiverId.S || "",
          senderId: message.senderId.S || "",
          message: message.message.S,
          time: message.message.S,
          status: unsetUnread(setRead(parseInt(message.status.S || "0")))
        })
      })
    }
  })

  return serverWithSocket
}

export const registerSocketRoutes = () => {

  router.post('/chat/send', async ctx => {
    const data: IChatMessageRecord = ctx.request?.body;
    try {
      const socketId: string = (await UserSocket.getRecord({userId: data.receiverId})).Item?.socketId.S  || "";
      const socketNamespace = _.first(_.split(socketId, '#')) || '';
      let status = setUnread();
      if (socketId && socketNamespace && _.includes(Object.keys(io.nsps[socketNamespace]?.connected), socketId)) {
        client.to(socketId).emit('chat-message', data);
        status = setRead(status)
      }
      await ChatMessage.createRecord({
        receiverId: data.receiverId,
        senderId: data.senderId,
        message: data.message,
        status,
      })
      ctx.status = 200;
    } catch (e) {
      console.log(e);
      ctx.status = 500;
    }

    ctx.body = {};
  });

  router.post('/chat/history', async ctx => {
    const {receiverId, senderId} =  ctx.request?.body || {};
    const {pageSize, pageIndex} = ctx.request.query || {};

    const records = await ChatMessage.getRecordsBySenderId({
      receiverId,
      senderId
    });
    
    const optimizedRecords = _.map(records.Items, (v) : IChatMessageRecord=> {
      return {
        id: v.id.S || "",
        senderId: v.senderId.S || "",
        receiverId: v.receiverId.S || "",
        message: v.message.S || "",
        time: v.time.S || "",
        status: parseInt(v.status.S || "0"),
      }
    })

    let data: Array<IChatMessageRecord> = []

    if(pageIndex && pageSize) {
      const chunks = _.chunk(optimizedRecords, pageSize)
      data = chunks[pageIndex] as any
    } else {
      data = optimizedRecords
    }

    
    const response: IApiResponse<Array<IChatMessageRecord>> = {
      status: 200,
      data,
      message: "Success",
      code: "S/G-C.H/001"  
    }

    ctx.status = 200;
    ctx.body = response;

  });

  return router;
}