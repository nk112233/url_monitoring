import React, { useEffect, useState } from "react";
import styles from "./register.module.scss";
import Spinner from "../../components/Spinner";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { reset, registerUser } from "@/features/auth/authSlice";
import { toast } from "react-toastify";
import bannerImage from "@/assets/images/image.png";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [signUpDetails, setSignUpDetails] = useState({
    email: "",
    password: "",
    confirmedPassword: "",
    firstName: "",
    lastName: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmedPassword, setShowConfirmedPassword] = useState(false);

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess || user) {
      navigate("/");
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  //handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignUpDetails((prevDetails) => {
      return {
        ...prevDetails,
        [name]: value,
      };
    });
  };

  //handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (signUpDetails.password !== signUpDetails.confirmedPassword) {
      return toast.error("Passwords do not match!");
    }
    const { confirmedPassword, ...userData } = signUpDetails;

    await dispatch(registerUser(userData));
    isSuccess && navigate("/email-verification");
  };

  return (
    <main className={styles.register}>
      <div className={styles.registerLeft}>
        <div className={styles.registerLeftWrapper}>
          <h4 className={styles.title}>Register</h4>
          <p className={styles.desc}>It takes just 30 seconds. Go ahead!</p>
          <form onSubmit={handleSubmit}>
            <div className={styles.towCol}>
              <div className={styles.inputControl}>
                <label>First Name</label>
                <input
                  onChange={handleChange}
                  type="text"
                  name="firstName"
                  required
                  placeholder="john"
                  value={signUpDetails.firstName}
                />
              </div>
              <div className={styles.inputControl}>
                <label>Last Name</label>
                <input
                  type="text"
                  onChange={handleChange}
                  name="lastName"
                  required
                  value={signUpDetails.lastName}
                  placeholder="doe"
                />
              </div>
            </div>
            <div className={styles.inputControl}>
              <label>Email address</label>
              <input
                autoComplete="off"
                type="text"
                required
                name="email"
                value={signUpDetails.email}
                onChange={handleChange}
                placeholder="name@gmail.com"
              />
            </div>
            <div className={styles.inputControl}>
              <label>Password</label>
              <input
                onChange={handleChange}
                autoComplete="off"
                type={showPassword ? "text" : "password"}
                value={signUpDetails.password}
                required
                placeholder="password"
                name="password"
              />
              <div
                className={styles.revealIcon}
                onClick={() => setShowPassword((prevState) => !prevState)}
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size="18px" color="#383838c6" />
                ) : (
                  <AiOutlineEye size="18px" color="#383838c6" />
                )}
              </div>
            </div>
            <div className={styles.inputControl}>
              <label>Confirm Password</label>
              <input
                onChange={handleChange}
                type={showConfirmedPassword ? "text" : "password"}
                required
                value={signUpDetails.confirmedPassword}
                placeholder="password"
                name="confirmedPassword"
              />
              <div
                className={styles.revealIcon}
                onClick={() =>
                  setShowConfirmedPassword((prevState) => !prevState)
                }
              >
                {showConfirmedPassword ? (
                  <AiOutlineEyeInvisible size="18px" color="#383838c6" />
                ) : (
                  <AiOutlineEye size="18px" color="#383838c6" />
                )}
              </div>
            </div>

            <button className={styles.loginButton}>
              {isLoading ? <Spinner /> : "Sign up"}
            </button>
            <p className={styles.redirect}>
              Already have an account? <Link to="/login">Login</Link>{" "}
            </p>
          </form>
        </div>
      </div>
      <div className={styles.loginRight}>
      <img src={bannerImage} alt="dashboard preview" />
      </div>
    </main>
  );
};

export default Register;
