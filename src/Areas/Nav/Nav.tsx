import { NavLink } from "react-router";

import "./nav.scss";

export default () => {
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
                Profile
            </NavLink>
        </>
    )
}