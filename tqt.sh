#!/bin/bash

# Start server
cd server && npm start & 

# Start admin client
cd client-admin && PORT=3001 npm start &

# Start customer client
cd client-customer && PORT=3002 npm start &

# Wait for all background processes
wait