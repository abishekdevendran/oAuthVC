<h1 align="center">oAuth VC</h1>

<p align="center">
A WebRTC Video calling App<br>
<img alt="GitHub Language Count" src="https://img.shields.io/github/languages/count/abishekdevendran/oAuthVC" />
<img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/abishekdevendran/oAuthVC" />
<img alt="GitHub Closed Issues" src="https://img.shields.io/github/issues-closed/abishekdevendran/oAuthVC" />
<img alt="GitHub Issues" src="https://img.shields.io/github/issues/abishekdevendran/oAuthVC" />
<img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/abishekdevendran/oAuthVC" />
</p>

## ReactJS
<p>
Frontend JS library for reusable modular components, easy UI state management and ease of lifecycle method control with hooks.
</p>

## TypeScript
<p>
Javascipt but with support for types, used to catch bugs in the fast paced development cycle to ensure consistency of data between components and server calls.
</p>

## Socket.IO
<p>
Wrapper over websockets(but still its own standard protocol) for better dev experience while handling bi directional communication between clients and server.
</p>

## ExpressJS and NodeJS
<p>
Server software(Express) and js runtime env(NodeJS) for writing backend
</p>

## PeerJS
<p>
Better implementation of webRTC which uses normal sockets in the implementation. Peer-Express server manage and connect peers, and they stream data and/or media through webRTC.
</p>

# Working Strategy

<p>
Authentication and Authorization Strategy: Username and password sent to backend, username and hashed passwords compared with mongoDB users, if authenticated, session created in local redis DB and cookie key set on client. SImilarly, google oAuth sends a request to third party with client key, returns user object, creates or compares user with mongoDB, sets session.<br>

Rooms are managed in memory. Every disconnect or clearRoom event handled by socketIO work together till room is empty where a cleanup function is triggered in the backend. Room joins are limited to a max of 2 ppl to give the one2one call experience.
</p>
