import { useRef, useEffect } from 'react';

import { colours, darkenColour } from "../helpers/ColourUtility";

interface WheelProps {
    options?: string[];
    rotate?: number;
}

export default (props: WheelProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const numSectors: number = props.options && props.options.length || 0;
    const currentRotation: number = !!props.rotate ? props.rotate : 0;

    useEffect(() => {
        if (canvasRef.current) {
          drawWheel();
        }
      }, [props.options, currentRotation]
    );

    const renderOption = (index: number) => {
        return props.options && props.options.length > index && capitalise(props.options[index]) || "Unknown";
    }

    const capitalise = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const drawWheel = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const radius = canvas.width / 2;
        const sliceAngle = (2 * Math.PI) / numSectors;

        // Clear previous drawing
        clearCanvas(canvas, ctx, radius);

        // Draw sectors
        for (let i = 0; i < numSectors; i++) {
          drawSector(ctx, i, sliceAngle, radius);
          drawSectorName(ctx, sliceAngle, i, radius);
        }

        ctx.rotate(currentRotation * (Math.PI / 180)); // Reset rotation
        ctx.translate(-radius, -radius);

        // Draw the static indicator
        drawIndicator(canvas, ctx);
    };

    const drawSector = (ctx: CanvasRenderingContext2D, index: number, sliceAngle: number, radius: number) => {
        const startAngle = index * sliceAngle;
        const endAngle = (index + 1) * sliceAngle;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        const color = darkenColour(colours[index % colours.length], 30);
        ctx.fillStyle = color;
        ctx.fill();
    }

    const drawSectorName = (ctx:CanvasRenderingContext2D, sliceAngle: number, index: number, radius: number) => {
        const startAngle = index * sliceAngle;
        const endAngle = (index + 1) * sliceAngle;

        ctx.save();
        ctx.rotate((startAngle + endAngle) / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 3;
        ctx.fillText(renderOption(index) || '', radius * 0.5, 0);
        ctx.restore();
    }

    const clearCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, radius: number) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(radius, radius);
        ctx.rotate(-currentRotation * (Math.PI / 180));
    }

    const drawIndicator = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {

        const indicatorWidth = 10;
        const indicatorHeight = 20;

        ctx.save();
        ctx.translate(canvas.width / 2, 0);

        ctx.beginPath();

            ctx.moveTo(-indicatorWidth / 2, 0);
            ctx.lineTo(0, indicatorHeight / 2);
            ctx.lineTo(indicatorWidth / 2, 0);
            ctx.lineTo(-indicatorWidth / 2, 0);

        ctx.closePath();

        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
    }

    return (
        <>
            <canvas
                ref={canvasRef}
                width={400}
                height={400}
                style={{ borderRadius: '50%', border: '2px solid black' }}
            ></canvas>
        </>
    )
}