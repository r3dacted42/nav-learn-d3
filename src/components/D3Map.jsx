import { useEffect, useRef } from 'react';
import nodeData from '../data.json';
import * as d3 from 'd3';
import './D3Map.css';
import { useTooltip } from './Tooltip';

export default function D3Map() {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const gridRef = useRef(null);
    const [tooltip, setTooltipVisible, setTooltipData, setPageXY] = useTooltip();

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const container = d3.select(containerRef.current);
        const gridGroup = d3.select(gridRef.current);

        // Get the actual dimensions of the SVG
        const width = svg.node().clientWidth;
        const height = svg.node().clientHeight;

        // Initial scales
        const xScale = d3.scaleLinear()
            .domain([d3.min(nodeData, d => d.x), d3.max(nodeData, d => d.x)])
            .range([50, width - 50]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(nodeData, d => d.y), d3.max(nodeData, d => d.y)])
            .range([50, height - 50]);

        // Function to draw gridlines
        function drawGridlines(xScale, yScale) {
            // Clear previous gridlines completely
            gridGroup.selectAll("*").remove();

            // Vertical gridlines
            gridGroup.selectAll("line.vertical")
                .data(xScale.ticks(10))
                .enter()
                .append("line")
                .attr("class", "vertical")
                .attr("x1", d => xScale(d))
                .attr("x2", d => xScale(d))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke-dasharray", "2,2");

            // Horizontal gridlines
            gridGroup.selectAll("line.horizontal")
                .data(yScale.ticks(10))
                .enter()
                .append("line")
                .attr("class", "horizontal")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", d => yScale(d))
                .attr("y2", d => yScale(d))
                .attr("stroke-dasharray", "2,2");
        }

        // Initial gridlines
        drawGridlines(xScale, yScale);

        // Create zoom behavior with constrained panning
        const zoom = d3.zoom()
            .scaleExtent([0.5, 4])
            .translateExtent([
                [-width, -height],     // Top-left boundary
                [width * 2, height * 2] // Bottom-right boundary
            ])
            .on("zoom", (event) => {
                // Apply the zoom transformation to the container
                container.attr("transform", event.transform);

                // Update gridlines with new scales
                const newXScale = event.transform.rescaleX(xScale);
                const newYScale = event.transform.rescaleY(yScale);
                drawGridlines(newXScale, newYScale);
            });

        // Apply zoom to the svg
        svg.call(zoom);

        // Render nodes
        const nodes = container.selectAll(".node")
            .data(nodeData)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${xScale(d.x)}, ${yScale(d.y)})`)
            .each(function (d) {
                d3.select(this)
                    .append("circle")
                    .attr("class", "node-circle")
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

        // Tooltip interactions
        nodes.on("mouseover", (event, d) => {
            const currentNode = d3.select(event.currentTarget);
            
            // Store original transform
            const originalTransform = currentNode.attr("transform");
            currentNode.attr("data-original-transform", originalTransform);

            // Scale up node
            currentNode
                .transition()
                .duration(150)
                .attr("transform", `${originalTransform} scale(1.2)`);

            // Show tooltip
            setTooltipVisible(true);
            setTooltipData(d);
            setPageXY({
                x: event.pageX,
                y: event.pageY
            });
        })
        .on("mousemove", (event) => {
            // Update tooltip position without moving the node
            setPageXY({
                x: event.pageX,
                y: event.pageY
            });
        })
        .on("mouseout", (event, d) => {
            const currentNode = d3.select(event.currentTarget);
            
            // Restore original transform
            const originalTransform = currentNode.attr("data-original-transform");
            currentNode
                .transition()
                .duration(150)
                .attr("transform", originalTransform);

            // Hide tooltip
            setTooltipVisible(false);
        });
    }, []);

    return (
        <>
            <svg 
                ref={svgRef} 
                className='map'
            >
                <g ref={gridRef} className="grid"></g>
                <g ref={containerRef}>
                    {/* Nodes will be added here by D3 */}
                </g>
            </svg>        
            {tooltip}
        </>
    );
}