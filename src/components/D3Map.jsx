import { useEffect, useRef } from 'react';
import nodeData from '../data.json';
import * as d3 from 'd3';
import './D3Map.css';
import { useTooltip } from './Tooltip';

export default function D3Map() {
    const svgRef = useRef(null);
    const [tooltip, setTooltipVisible, setTooltipData, setPageXY] = useTooltip();

    useEffect(() => {
        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;
        const svg = d3.select(svgRef.current);
        svg.attr("width", width).attr("height", height);

        const xScale = d3.scaleLinear()
            .domain([d3.min(nodeData, d => d.x), d3.max(nodeData, d => d.x)])
            .range([50, width - 50]);
        const yScale = d3.scaleLinear()
            .domain([d3.min(nodeData, d => d.y), d3.max(nodeData, d => d.y)])
            .range([50, height - 50]);

        function zoomed({ transform }) {
            xScale.range([transform.x, transform.x + width]).rangeRound([transform.x, transform.x + width]);
            yScale.range([transform.y, transform.y + height]).rangeRound([transform.y, transform.y + height]);
            nodes.attr('transform', () => `translate(${transform.x},${transform.y}) scale(${transform.k})`);
        }
        const zoom = d3.zoom()
            .scaleExtent([0.5, 4])
            .on("zoom", zoomed);
        svg.call(zoom);

        const nodes = svg.selectAll(".node")
            .data(nodeData)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${xScale(d.x)}, ${yScale(d.y)})`)
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

        nodes.on("mouseover", (event, d) => {
            // Increase node size on hover
            d3.select(event.target)
                .on("mousemove", handleTooltipMove)
                .transition()
                .duration(150)
                .attr("transform", d => `scale(1.2)`);

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
                    .attr("transform", d => `scale(1)`);

                // Hide tooltip
                setTooltipVisible(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <svg className='map' ref={svgRef}></svg>
            {tooltip}
        </>
    );
}