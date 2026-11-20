import React from 'react'
import '.././index.css'

const NotFound = () => {


    return (
        <div className="not-found-container">
            <Navbar />
            <div className="not-found-content">
                <div className="not-found-glitch">
                    <h1 className="glitch-text" data-text="404">404</h1>
                </div>

                <div className="not-found-divider"></div>

                <h2 className="not-found-title">Página no encontrada</h2>
                <p className="not-found-message">
                    La página que buscas se ha perdido en el ciberespacio.
                </p>

                <div classNa0me="not-found-illustration">
                    <div className="lost-cube">
                        <div className="mini-cube">
                            <div className="mini-face front"></div>
                            <div className="mini-face back"></div>
                            <div className="mini-face right"></div>
                            <div className="mini-face left"></div>
                            <div className="mini-face top"></div>
                            <div className="mini-face bottom"></div>
                        </div>
                        <div className="question-mark">?</div>
                    </div>
                </div>

                <div className="not-found-actions">
                    <button className="nf-btn primary" onClick={() => navigate('/home')}>
                        Volver al inicio
                    </button>
                    <button className="nf-btn secondary" onClick={() => navigate(-1)}>
                        Regresar
                    </button>
                </div>

                <div className="not-found-footer">
                    <span>Error 404 • NoxCube</span>
                </div>
            </div>
        </div>
    );
};

export default NotFound
