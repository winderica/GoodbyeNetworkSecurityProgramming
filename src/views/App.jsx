import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { observer } from 'mobx-react';

import { theme, useStyles } from '../styles/global';
import { ChatRoom } from './ChatRoom';

export const App = observer(() => {
    useStyles();
    return (
        <CssBaseline>
            <ThemeProvider theme={theme}>
                <SnackbarProvider maxSnack={5} anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
                    <ChatRoom />
                </SnackbarProvider>
            </ThemeProvider>
        </CssBaseline>
    );
});
