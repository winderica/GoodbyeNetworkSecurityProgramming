import React, { useEffect, useState } from 'react';

import { classNames } from '../utils/classNames';

import { Avatar, Chip, Dialog, Divider, IconButton, Paper, TextField, Typography } from '@material-ui/core';

import PlusOneIcon from '@material-ui/icons/ExposurePlus1';
import FaceIcon from '@material-ui/icons/Face';
import InsertPhotoIcon from '@material-ui/icons/InsertPhoto';
import SendIcon from '@material-ui/icons/Send';
import { observer } from 'mobx-react';
import { useStyles } from '../styles/messenger';
import { useStores } from '../hooks/useStores';

const EnlargeableImage = ({ src }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <img src={src} onClick={handleOpen} className={classes.image} alt='small' />
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth={false}
                classes={{ paper: classes.imageLayer, root: classes.imageRoot }}>
                <img src={src} onClick={handleClose} className={classes.image} alt='original' />
            </Dialog>
        </>
    );
};

export const Messenger = observer(({ peerIP }) => {
    const classes = useStyles();
    const { notificationStore, messageStore, connectionStore } = useStores();
    const [content, setContent] = useState('');
    const [container, setContainer] = useState(null);
    const sendMessage = async (message) => {
        if (!connectionStore.connections[peerIP]) {
            notificationStore.enqueueError(`尚未连接${peerIP}`);
            return;
        }
        connectionStore.connections[peerIP].sendMessage(JSON.stringify(message));
        await messageStore.addMessage(peerIP, message);
    };
    const messages = messageStore.messages[peerIP] || []

    useEffect(() => {
        if (container && container.scrollHeight - container.scrollTop < 1000) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, container]);

    const generateMessage = (message, isImage = false) => ({
        content: message || '',
        isSelf: true,
        time: Date.now(),
        isImage,
    });

    const handleKey = (event) => {
        const { ctrlKey, charCode } = event;
        if (ctrlKey && charCode === 13) {
            setContent((prevContent) => prevContent + '\n');
        }
        if (!ctrlKey && charCode === 13) {
            event.preventDefault();
            if (content && content.match(/\S+/)) {
                send();
            }
        }
    };

    const handlePaste = (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (const i of Object.values(items)) {
            if (i.type.startsWith('image')) {
                const blob = i.getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        await sendMessage(generateMessage(reader.result, true));
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    const resetInput = ({ currentTarget }) => {
        currentTarget.value = '';
    };

    const handleImage = ({ target: { files } }) => {
        if (!files) {
            notificationStore.enqueueInfo('你没有上传任何图片');
            return;
        }
        const file = files[0];
        const extension = file.name.split('.').slice(-1)[0];
        if (!['jpg', 'jpeg', 'png'].includes(extension)) {
            notificationStore.enqueueInfo('请上传jpg或png类型的图片');
            return;
        }
        if (file.size > 1024 * 1024 * 5) {
            notificationStore.enqueueInfo('图片大小必须小于5MB');
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            await sendMessage(generateMessage(reader.result, true));
        };
    };

    const handleChange = ({ target: { value } }) => {
        setContent(value);
    };

    const plusOne = async () => {
        const last = messages[messages.length - 1];
        if (last) {
            await sendMessage(generateMessage(last.content, last.isImage));
        }
    };

    const send = async () => {
        await sendMessage(generateMessage(content));
        setContent('');
    };

    const placeHolders = [
        'ctrl + Enter 以输入回车',
        '可以直接发送剪贴板中的图片',
        '图片大小必须小于5MB',
    ];
    const MessageChip = ({ isSelf, time, isImage, content: message }) => (
        <div className={classes.message}>
            <div className={classNames(isSelf && classes.rightAlign)}>
                {new Date(time).toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
            <Divider className={classNames(isSelf && classes.myDivider)} />
            <div className={classes.messageContent}>
                {isImage ? (
                    <EnlargeableImage src={message} />
                ) : (
                    message.split('\n').map((text, index) => (
                        <span key={index}>{text}<br /></span>
                    ))
                )}
            </div>
        </div>
    );
    if (!peerIP) {
        return (
            <Paper className={classNames(classes.messenger, classes.alertContainer)}>
                <Typography variant='h2' color='textSecondary'>
                    Select a peer to get started
                </Typography>
            </Paper>
        )
    }
    return (
        <Paper className={classes.messenger}>
            <div className={classes.messages} ref={setContainer}>
                {messages.map((message, index) => (
                    <div key={index} className={classNames(classes.messageContainer, message.isSelf && classes.my)}>
                        <Avatar className={classes.avatar} children={<FaceIcon />} />
                        <Chip
                            label={MessageChip(message)}
                            classes={{ root: classNames(classes.chipRoot, message.isSelf && classes.myChip) }}
                        />
                    </div>
                ))}
            </div>
            <div className={classes.input}>
                <Divider />
                <div className={classes.inputContent}>
                    <input
                        accept='image/png, image/jpeg'
                        className={classes.hidden}
                        id='file'
                        type='file'
                        onChange={handleImage}
                        onClick={resetInput}
                    />
                    <label htmlFor='file'>
                        <IconButton color='primary' component='span'>
                            <InsertPhotoIcon />
                        </IconButton>
                    </label>
                    <IconButton color='primary' component='span' onClick={plusOne} disabled={!messages.length}>
                        <PlusOneIcon />
                    </IconButton>
                    <TextField
                        multiline
                        rowsMax={4}
                        value={content}
                        placeholder={placeHolders[~~(Math.random() * placeHolders.length)]}
                        className={classes.textField}
                        margin='normal'
                        onChange={handleChange}
                        onKeyPress={handleKey}
                        onPaste={handlePaste}
                    />
                    <IconButton
                        color='primary'
                        component='span'
                        onClick={send}
                        disabled={!(content && content.match(/\S+/))}>
                        <SendIcon />
                    </IconButton>
                </div>
            </div>
        </Paper>
    );
});
