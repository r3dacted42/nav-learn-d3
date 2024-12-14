import { useEffect, useRef, useState } from "react";
import './Tooltip.css';

function useTooltip() {
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipData, setTooltipData] = useState(null);
    const [pageXY, setPageXY] = useState(null);

    const tooltip = <Tooltip
        data={tooltipData}
        isVisible={tooltipVisible}
        pageXY={pageXY}
    />;

    return [tooltip, setTooltipVisible, setTooltipData, setPageXY];
}

function Tooltip({ data, isVisible, pageXY }) {
    const [resName, setResName] = useState(null);
    const [resType, setResType] = useState(null);
    const [moduleId, setModuleId] = useState(null);
    const [position, setPosition] = useState(null);

    const tooltipRef = useRef(null);

    useEffect(() => {
        if (data) {
            setResName(data.name);
            setResType(data.type);
            setModuleId(data.moduleId);
            setPosition(`${data.x}, ${data.y}`);
        }
    }, [data]);

    useEffect(() => {
        tooltipRef.current.style.opacity = isVisible ? 1 : 0;
    }, [isVisible]);

    useEffect(() => {
        if (!pageXY) return;
        const w = window.innerWidth, h = window.innerHeight;
        const style = tooltipRef.current.style;
        const tooltipWidth = tooltipRef.current.offsetWidth;
        const tooltipHeight = tooltipRef.current.offsetHeight;
        const xPad = 20, yPad = 30;
        const availableWidth = w - pageXY.x - xPad;
        const availableHeight = h - pageXY.y - yPad;
        let left, top;
        if (availableWidth > tooltipWidth) {
            // Place left
            left = pageXY.x + xPad;
        } else {
            // Place right
            left = pageXY.x - tooltipWidth - xPad;
        }
        if (availableHeight > tooltipHeight) {
            // Place top
            top = pageXY.y - yPad;
        } else {
            // Place bottom
            top = pageXY.y - tooltipHeight + yPad;
        }
        style.left = `${left}px`;
        style.top = `${top}px`;
    }, [pageXY]);

    return (
        <div className='tooltip' ref={tooltipRef}>
            <span><b>Name:</b> {resName}</span>
            <span><b>Type:</b> {resType}</span>
            <span><b>Module ID:</b> {moduleId}</span>
            <span><b>Position:</b> {position}</span>
        </div>
    );
}

export { useTooltip, Tooltip };