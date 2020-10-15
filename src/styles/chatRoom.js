import { makeStyles } from '@material-ui/core';

export const useStyles = makeStyles(() => ({
    container: {
        display: 'flex',
        height: '100%'
    },
    list: {
        display: 'flex',
        flexDirection: 'column'
    },
    listItems: {
        flex: '1',
        overflowY: 'auto'
    },
    listInput: {
        display: 'flex'
    }
}));
