import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { observer } from 'mobx-react';

import { theme, useStyles } from '../styles/global';
import { ChatRoomWrapper } from './ChatRoom';
import { Frame } from '../components/Frame';

export const App = observer(() => {
    useStyles();
    return (
        <CssBaseline>
            <ThemeProvider theme={theme}>
                <SnackbarProvider maxSnack={5} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    <Frame>
                        <ChatRoomWrapper />
                    </Frame>
                </SnackbarProvider>
            </ThemeProvider>
        </CssBaseline>
    );
});
