import { createMuiTheme, makeStyles } from '@material-ui/core';
import { blue, pink } from '@material-ui/core/colors';

export const useStyles = makeStyles(() => ({
    '@global': {
        '::-webkit-scrollbar': {
            width: 3,
            height: 12,
        },
        '::-webkit-scrollbar-thumb': {
            background: '#aaa',
            borderRadius: 1,
        },
        '*': {
            '-webkit-tap-highlight-color': 'transparent',
        },
        'html, body, react': {
            height: '100%',
        },
    },
}));

export const theme = createMuiTheme({
    palette: {
        primary: blue,
        secondary: pink,
    }
});
