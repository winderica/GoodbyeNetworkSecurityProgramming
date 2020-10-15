import { makeStyles } from '@material-ui/core';

export const useStyles = makeStyles(({ spacing, transitions, breakpoints, palette, zIndex }) => ({
    imageRoot: {
        zIndex: zIndex.snackbar * 4,
    },
    imageLayer: {
        maxHeight: '100%',
    },
    image: {
        '&:hover': {
            cursor: 'pointer',
        },
        maxWidth: '100%',
    },
    messenger: {
        display: 'flex',
        flexDirection: 'column',
        margin: spacing(1),
        marginLeft: 0,
        padding: spacing(1),
        flex: '1',
    },
    messages: {
        flex: '1',
        overflowY: 'auto',
        padding: spacing(1),
        marginBottom: spacing(1),
        transition: transitions.create(['padding'], {
            easing: transitions.easing.sharp,
            duration: transitions.duration.enteringScreen,
        }),
    },
    messageContainer: {
        display: 'flex',
        margin: `${spacing(1)}px 0`,
    },
    input: {
        marginTop: 'auto',
    },
    inputContent: {
        display: 'flex',
        alignItems: 'flex-end',
    },
    textField: {
        width: '100%',
    },
    chipRoot: {
        height: 'auto',
        padding: spacing(1),
        whiteSpace: 'normal',
        background: palette.secondary.light + '88',
        '& > *': {
            whiteSpace: 'normal',
        },
    },
    myChip: {
        background: palette.primary.main + 'cc',
        color: palette.primary.contrastText,
    },
    myDivider: {
        background: 'white',
    },
    messageContent: {
        wordWrap: 'break-word',
        maxWidth: 300,
        userSelect: 'text',
        cursor: 'text',
        marginTop: spacing(1),
    },
    avatar: {
        margin: spacing(1),
    },
    my: {
        flexDirection: 'row-reverse',
    },
    rightAlign: {
        marginLeft: 'auto',
    },
    message: {
        display: 'flex',
        flexDirection: 'column',
    },
    hidden: {
        display: 'none',
    },
    alertContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    }
}));
