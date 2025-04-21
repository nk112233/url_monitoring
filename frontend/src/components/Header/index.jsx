import React, { useState } from "react";
import styles from "./Header.module.scss";
import { AiOutlineDown } from "react-icons/ai";
import { useSelector } from "react-redux";
import HeaderMenu from "@/components/HeaderMenu";
import ThemeToggle from "../ThemeToggle";

const Header = () => {
  const [showMenu, setShowMenu] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';

  return (
    <header className={styles.header}>
      <ThemeToggle />
      <div
        onClick={() => setShowMenu((prevState) => !prevState)}
        className={`${styles.header_details} hoverEffect`}
      >
        <div className={styles.header_pp}>
          {firstName && lastName ? (
            <div className={styles.letters}>
              {firstName[0].toUpperCase() + " " + lastName[0].toUpperCase()}
            </div>
          ) : (
            <div className={styles.letters}>...</div>
          )}
        </div>
        <p>{firstName && lastName ? `${firstName} ${lastName}` : "Loading..."}</p>
        <AiOutlineDown />
      </div>
      {showMenu && <HeaderMenu />}
    </header>
  );
};

export default Header;
