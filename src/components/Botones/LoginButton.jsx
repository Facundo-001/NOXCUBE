import '../../styles/LoginButton.css';

const LoginButton = ({ texto }) => {
    return (
        <button className="login-button" type="submit">
            {texto}
        </button>
    );
};

export default LoginButton;