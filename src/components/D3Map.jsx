import { useEffect, useRef, useState } from 'react';
import nodeData from '../data.json';
import * as d3 from 'd3';
import './D3Map.css';
import { useTooltip } from './Tooltip';

export default function D3Map() {
    const svgRef = useRef(null);
    const [tooltip, setTooltipVisible, setTooltipData, setPageXY] = useTooltip();

    const [width, setWidth] = useState(null);
    const [height, setHeight] = useState(null);

    const [nodes, setNodes] = useState(null);
    const [xScale, setXScale] = useState(null);
    const [yScale, setYScale] = useState(null);
    const [transform, setTransform] = useState(null);

    function handleResize() {
        setWidth(svgRef.current.clientWidth);
        setHeight(svgRef.current.clientHeight);
    }

    useEffect(() => {
        const _width = svgRef.current.clientWidth;
        const _height = svgRef.current.clientHeight;
        window.addEventListener("resize", handleResize);

        const svg = d3.select(svgRef.current);
        svg.attr("width", _width).attr("height", _height);

        const _xScale = d3.scaleLinear()
            .domain([d3.min(nodeData, d => d.x), d3.max(nodeData, d => d.x)])
            .range([50, _width - 50]);
        setXScale(_xScale);

        const _yScale = d3.scaleLinear()
            .domain([d3.min(nodeData, d => d.y), d3.max(nodeData, d => d.y)])
            .range([50, _height - 50]);
        setYScale(_yScale);

        const zoom = d3.zoom()
            .scaleExtent([0.5, 4])
            .on("zoom", zoomed);
        svg.call(zoom);

        let _nodes = svg.selectAll(".node")
            .data(nodeData)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${_xScale(d.x)}, ${_yScale(d.y)})`)
            .each(function (d) {
                d3.select(this)
                    .append("circle")
                    .attr("class", "node")
                    .attr("r", 16);
                d3.select(this)
                    .append("use")
                    .attr("xlink:href", `#${d.type}`)
                    .attr("width", 24)
                    .attr("height", 24)
                    .attr("pointer-events", "none")
                    .attr("x", -12)
                    .attr("y", -12);
            });

        function handleTooltipMove(event) {
            setPageXY({
                x: event.pageX,
                y: event.pageY
            });
        }

        _nodes.on("mouseover", (event, d) => {
            // Increase node size on hover
            d3.select(event.target)
                .on("mousemove", handleTooltipMove)
                .transition()
                .duration(150)
                .attr("transform", "scale(1.2)");

            // Show tooltip
            setTooltipVisible(true);
            setTooltipData(d);
            handleTooltipMove(event);
        })
            .on("mouseout", (event, d) => {
                // Reset node size on mouseout
                d3.select(event.target)
                    .on("mousemove", null)
                    .transition()
                    .duration(150)
                    .attr("transform", "scale(1)");

                // Hide tooltip
                setTooltipVisible(false);
            });

        setNodes(_nodes);

        function zoomed({ transform }) {
            console.log("zooming...");
            setTransform(transform);
        }

        return (() => {
            window.removeEventListener("resize", handleResize);
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.attr("width", width).attr("height", height);
        setXScale(d3.scaleLinear()
            .domain([d3.min(nodeData, d => d.x), d3.max(nodeData, d => d.x)])
            .range([50, width - 50]));
        setYScale(d3.scaleLinear()
            .domain([d3.min(nodeData, d => d.y), d3.max(nodeData, d => d.y)])
            .range([50, height - 50]));
    }, [height, width]);

    useEffect(() => {
        if (!transform || !xScale || !yScale) return;
        
        var new_xScale = transform.rescaleX(xScale);
        var new_yScale = transform.rescaleY(yScale);
        setXScale(new_xScale);
        setYScale(new_yScale);
        nodes.attr('transform', d => `translate(${new_xScale(d.x)}, ${new_yScale(d.y)}) scale(${transform.k})`);
        setNodes(nodes);
    }, [transform]);

    return (
        <>
            <svg className='map' ref={svgRef}></svg>
            {tooltip}
        </>
    );
}