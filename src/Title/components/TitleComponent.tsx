import "../styles/TitleComponent.scss";

export interface TitleProps {
    greeting: string;
}

function TitleComponent(props: TitleProps) {

    return (
        <>
            <h1 className="title_header">
                {props.greeting}
            </h1>
        </>
    )
}

export default TitleComponent;