import { Button, Typography } from '@material-ui/core';
import { observer } from 'mobx-react';
import React, { useState } from 'react';
import { Dialog } from './Dialog';
import { useStores } from '../hooks/useStores';

const { dialog } = window.require('electron').remote;

export const CertsDialog = observer(() => {
    const { certsStore } = useStores();
    const [ca, setCA] = useState('');
    const [key, setKey] = useState('');
    const [cert, setCert] = useState('');
    const handleCA = async () => {
        const response = await dialog.showOpenDialog({
            properties: ['openFile']
        });
        if (!response.canceled) {
            setCA(response.filePaths[0]);
        }
    };
    const handleKey = async () => {
        const response = await dialog.showOpenDialog({
            properties: ['openFile']
        });
        if (!response.canceled) {
            setKey(response.filePaths[0]);
        }
    };
    const handleCert = async () => {
        const response = await dialog.showOpenDialog({
            properties: ['openFile']
        });
        if (!response.canceled) {
            setCert(response.filePaths[0]);
        }
    };
    const handleSubmit = async () => {
        await certsStore.set(ca, cert, key);
    };
    return (
        <Dialog
            open={true}
            setOpen={() => undefined}
            title='请选择必要文件'
            content={
                <>
                    <Button color='primary' onClick={handleCA}>CA文件</Button>
                    <Button color='primary' onClick={handleCert}>Cert文件</Button>
                    <Button color='primary' onClick={handleKey}>Key文件</Button>
                    <Typography>CA: {ca || '未选择'}</Typography>
                    <Typography>Cert: {cert || '未选择'}</Typography>
                    <Typography>Key: {key || '未选择'}</Typography>
                </>
            }
            actions={
                <Button color='primary' onClick={handleSubmit}>提交</Button>
            }
        />
    );
});
