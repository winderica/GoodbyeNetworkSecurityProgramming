import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { observer } from 'mobx-react';

import { theme, useStyles } from '../styles/global';
import { ChatRoom } from './ChatRoom';
import { Frame } from '../components/Frame';

export const App = observer(() => {
    useStyles();
    return (
        <CssBaseline>
            <ThemeProvider theme={theme}>
                <SnackbarProvider maxSnack={5} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    <Frame>
                        <ChatRoom />
                    </Frame>
                </SnackbarProvider>
            </ThemeProvider>
        </CssBaseline>
    );
});
