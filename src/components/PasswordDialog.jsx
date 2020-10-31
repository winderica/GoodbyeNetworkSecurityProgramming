import { Button, TextField } from '@material-ui/core';
import { observer } from 'mobx-react';
import React, { useState } from 'react';

import { Dialog } from './Dialog';
import { useStores } from '../hooks/useStores';
import { sha256 } from '../utils/sha';

export const PasswordDialog = observer(() => {
    const { messageStore, notificationStore } = useStores();
    const [password, setPassword] = useState('');
    const handleInput = ({ target: { value } }) => {
        setPassword(value);
    };
    const handleSubmit = async () => {
        try {
            await messageStore.load(await sha256(password));
        } catch {
            notificationStore.enqueueError('解密失败');
        }
    };
    return (
        <Dialog
            open={!messageStore.initialized}
            setOpen={() => undefined}
            title='请输入密码'
            content={
                <TextField
                    autoFocus
                    margin='dense'
                    label='password'
                    value={password}
                    fullWidth
                    type='password'
                    onChange={handleInput}
                />
            }
            actions={
                <Button color='primary' onClick={handleSubmit}>提交</Button>
            }
        />
    );
});
