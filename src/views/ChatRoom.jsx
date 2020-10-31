import { Box, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, Popover, TextField, Typography } from '@material-ui/core';
import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';

import { useStores } from '../hooks/useStores';
import { Messenger } from '../components/Messenger'
import { useStyles } from '../styles/chatRoom';
import { AddCircle as AddIcon, Cached as ConnectIcon, Info as InfoIcon } from '@material-ui/icons';
import { PasswordDialog } from '../components/PasswordDialog';
import { addon } from '../utils/addon';

const { ipcRenderer } = window.require('electron');

export const ChatRoom = observer(({ client }) => {
    const classes = useStyles();
    const { messageStore, connectionStore, notificationStore } = useStores();
    const [ip, setIP] = useState('');
    const [input, setInput] = useState('');
    const [viewingCert, setViewingCert] = useState({});
    const [anchorEl, setAnchorEl] = useState(null);
    const connect = (ip) => {
        if (!connectionStore.connections[ip]) {
            client.connect(ip, 9999, (err, connection) => {
                if (err) {
                    notificationStore.enqueueError(err.message);
                } else {
                    connectionStore.addConnection(ip, connection);
                    messageStore.addIP(ip);
                    notificationStore.enqueueSuccess(`Connected to ${ip} and verified cert`);
                }
            });
        }
    }
    useEffect(() => {
        ipcRenderer.on('connection', (event, { ip }) => {
            notificationStore.enqueueInfo(`Connection from ${ip}`);
            connect(ip);
        });
        ipcRenderer.on('disconnection', (event, { ip }) => {
            notificationStore.enqueueInfo(`Disconnection from ${ip}`);
            connectionStore.removeConnection(ip);
        });
        ipcRenderer.on('message', async (event, { ip, data }) => {
            data = JSON.parse(data);
            data.isSelf = false;
            await messageStore.addMessage(ip, data);
            connect(ip);
        });
        ipcRenderer.on('error', (event, { message }) => {
            notificationStore.enqueueError(`Disconnection from ${message}`);
        });
        window.addEventListener('unload', () => {
            Object.values(connectionStore.connections).map(i => i.disconnect());
        });
    }, []);
    const handleViewCert = (ip) => (event) => {
        setAnchorEl(event.currentTarget);
        setViewingCert(connectionStore.connections[ip]);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const addConnection = () => {
        notificationStore.enqueueInfo(`Connecting to ${input}`);
        connect(input.split('.').map(i => +i).join('.'));
        setInput('');
    }
    const reconnect = (ip) => () => {
        notificationStore.enqueueInfo(`Connecting to ${ip}`);
        connect(ip);
    }
    return (
        <>
            <PasswordDialog />
            <div className={classes.container}>
                <List component="nav" className={classes.list}>
                    <div className={classes.listItems}>
                        {messageStore.ips.map(i => (
                            <ListItem
                                button
                                selected={ip === i}
                                onClick={() => setIP(i)}
                                key={i}
                            >
                                <ListItemText
                                    primary={<Typography color={connectionStore.connections[i] ? 'primary' : 'secondary'}>{i}</Typography>} />
                                <ListItemSecondaryAction>
                                    <IconButton edge='end' onClick={handleViewCert(i)} disabled={!connectionStore.connections[i]}>
                                        <InfoIcon />
                                    </IconButton>
                                    <IconButton edge='end' onClick={reconnect(i)} disabled={!!connectionStore.connections[i]}>
                                        <ConnectIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </div>
                    <div className={classes.listInput}>
                        <TextField label="peer IP" variant="outlined" value={input} onChange={(event) => setInput(event.target.value)} />
                        <IconButton
                            color='primary'
                            component='span'
                            onClick={addConnection}
                            disabled={!input}
                        >
                            <AddIcon />
                        </IconButton>
                    </div>
                </List>
                {useMemo(() => <Messenger peerIP={ip} />, [ip])}
            </div>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box p={2}>
                    <Typography>Subject: {viewingCert.subject}</Typography>
                    <Typography>Issuer: {viewingCert.issuer}</Typography>
                </Box>
            </Popover>
        </>
    );
});

export const ChatRoomWrapper = observer(() => {
    const { notificationStore, certsStore } = useStores();
    const [client, setClient] = useState(null);
    useEffect(() => {
        try {
            addon.init(certsStore.ca, certsStore.cert, certsStore.key);
            setClient(new addon.Client());
            ipcRenderer.send('certs', {
                ca: certsStore.ca,
                key: certsStore.key,
                cert: certsStore.cert
            });
        } catch (e) {
            notificationStore.enqueueError(e.message);
            certsStore.set(undefined, undefined, undefined);
        }
    }, []);
    return client ? <ChatRoom client={client} /> : null;
})
