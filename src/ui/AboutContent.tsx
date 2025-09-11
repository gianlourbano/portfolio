export function AboutContent() {
    return (
        <div className="prose">
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <img
                    src="https://github.com/gianlourbano.png"
                    alt="Gianlorenzo Urbano avatar"
                    width={72}
                    height={72}
                    style={{
                        imageRendering: "pixelated",
                        border: "2px solid #808080",
                        background: "#fff",
                    }}
                />
                <div>
                    <h2 style={{ margin: 0 }}>Gianlorenzo Urbano</h2>
                    <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                        <a
                            href="https://github.com/gianlourbano"
                            target="_blank"
                            rel="noreferrer"
                        >
                            GitHub (@gianlourbano)
                        </a>
                        {/* Add your LinkedIn and Email below if you like */}
                        {/* <a href="https://www.linkedin.com/in/<your-handle>/" target="_blank" rel="noreferrer">LinkedIn</a> */}
                        {/* <a href="mailto:you@example.com">Email</a> */}
                    </div>
                </div>
            </div>

            <p>
                Data/AI Engineer at Musixmatch. I ship reliable data/ML systems
                and enjoy building delightful tools with a retro twist.
            </p>

            <h3>Stack</h3>
            <ul style={{ columns: 2, listStyle: "square", paddingLeft: 18 }}>
                <li>Python</li>
                <li>SQL</li>
                <li>Airflow</li>
                <li>Spark</li>
                <li>TypeScript</li>
                <li>React</li>
                <li>Node.js</li>
                <li>MDX</li>
            </ul>
        </div>
    );
}
