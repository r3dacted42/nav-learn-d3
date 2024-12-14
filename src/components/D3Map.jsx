import { useEffect, useRef, useState } from 'react';
import nodeData from '../data.json';
import * as d3 from 'd3';
import './D3Map.css';
import { useTooltip } from './Tooltip';

export default function D3Map() {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const gridRef = useRef(null);
    const [tooltip, setTooltipVisible, setTooltipData, setPageXY] = useTooltip();

    // State to track active filters
    const [activeFilters, setActiveFilters] = useState([]);

    // File type icons mapping
    const fileTypes = ["pdf", "docx", "pptx", "mp3", "mp4"];

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
                .attr("stroke", "#e0e0e0")
                .attr("stroke-opacity", 0.5)
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
                .attr("stroke", "#e0e0e0")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2");
        }

        // Initial gridlines
        drawGridlines(xScale, yScale);

        // Create zoom behavior with constrained panning
        const zoom = d3.zoom()
            .scaleExtent([0.75, 4])
            .translateExtent([
                [-width * 0.2, -height * 0.2],     // Top-left boundary
                [width * 1.2, height * 1.2] // Bottom-right boundary
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

        // Reset zoom function
        window.resetZoom = () => {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        };

        // Render nodes
        const nodes = container.selectAll(".node")
            .data(nodeData)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("data-type", d => d.type)
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

        // Filter function
        window.filterNodes = (type) => {
            console.log("filtering for " + type);

            // Toggle filter
            setActiveFilters(prevFilters => {
                const currentFilters = new Set(prevFilters);
                if (currentFilters.has(type)) {
                    currentFilters.delete(type);
                } else {
                    currentFilters.add(type);
                }
                const newFilters = Array.from(currentFilters);
                console.log(newFilters);

                // Apply filtering
                const nodes = d3.selectAll(".node");
                if (newFilters.length > 0) {
                    nodes.style("opacity", function (d) {
                        return newFilters.includes(d.type) ? 1 : 0.2;
                    });
                } else {
                    // No filters, reset opacity
                    nodes.style("opacity", 1);
                }

                return newFilters;
            });
        };

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

    // Render filter buttons
    const renderFilterButtons = () => {
        return fileTypes.map(type => (
            <button
                key={type}
                onClick={() => window.filterNodes(type)}
                className={`filter-btn ${activeFilters.includes(type) ? 'active' : ''}`}
            >
                <svg width="24" height="24">
                    <use xlinkHref={`#${type}`} width="24" height="24" />
                </svg>
            </button>
        ));
    };

    return (
        <div className="map">
            <div className="map-controls">
                <div className="filter-buttons">
                    {renderFilterButtons()}
                </div>
                <button
                    onClick={() => window.resetZoom()}
                    className="reset-zoom-btn"
                >
                    Reset Zoom
                </button>
            </div>
            <svg
                ref={svgRef}
                className="map-svg"
            >
                <g ref={gridRef} className="grid"></g>
                <g ref={containerRef}>
                    {/* Nodes will be added here by D3 */}
                </g>
            </svg>
            {tooltip}
        </div>
    );
}