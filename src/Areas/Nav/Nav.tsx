import { NavLink } from "react-router";
import Auth from "../../Auth/Firebase/Auth";
import { AuthType } from "../../Auth/Firebase/types";

import "./nav.scss";

const Nav = () => {
    return (
        <>
            <NavLink className="nav-item logo" to="/" end>
                Home
            </NavLink>

            <div className="nav-main">
                <NavLink className="nav-item" to="/Spinner" end>
                    Spinner
                </NavLink>
            </div>

            <NavLink className="nav-item profile" to="/Profile" end>
                <Auth type={AuthType.Popup} />
            </NavLink>
        </>
    )
}

export default Nav;