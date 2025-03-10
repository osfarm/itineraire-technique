
class RotationRenderer {
    constructor() { 
        this.barHeight = 100;
        
        this.currentFocusIndex = null;
        this.noFocusUpdate = false;

        this.chart = null;
    }
 
    render(divID, transcriptDivID, rotationData, mode = 'horizontal') {

        let self = this;

        // Initialize the echarts instance based on the prepared dom
        self.chart = echarts.init(document.getElementById(divID));
    
        if (mode == 'horizontal')
            this.renderHorizontal(rotationData);
        else
            this.renderAsRotation(rotationData);

        var html = this.buildHTML(rotationData);
        $('#' + transcriptDivID + ' > div').html(html);

        $('#' + transcriptDivID).on("scroll", function () {
    
            if (self.noFocusUpdate)
                return;
    
            // Get the item which center is the closest to the center of the div. 
            // If we are close to the top or bottom of the list, consider the top or the bottom
    
            let scrollTop = $(this).scrollTop();

            let transcriptTextDiv = $(this).children().first();

            let totalHeight = transcriptTextDiv.height() - $('#itk_text').height();
            let center = transcriptTextDiv.height() * scrollTop / totalHeight;
    
            let items = [];
            $('#itk_text .rotation_item').each((i, element) => {
                var element = $(element)[0];
                let rect = element.getBoundingClientRect();
    
                let middle = element.offsetTop + rect.height / 2;
    
                items.push({ 'id': element.id, 'middle': middle, 'distance': Math.abs(middle - center), 'text': element.firstChild.textContent });
            });
    
            items.sort((a, b) => {
                return a.distance - b.distance;
            });
    
            let focusedItem = items[0].id;
            let newFocusIndex = focusedItem.replace('rotation_', '');
    
            self.highlightItem(newFocusIndex);
        });
    
        $(".intervention").on('click', function () {
    
            let focusedItem = this.id;
            let newFocusIndex = focusedItem.replace('rotation_', '');
    
            self.highlightItem(newFocusIndex);
        });
    
        // resize all charts when the windows is resized
        $(window).on('resize', _.debounce(function () {
            $(".charts").each(function () {
                var id = $(this).attr('_echarts_instance_');
                window.echarts.getInstanceById(id).resize();
            });
        }, 500));        
    }

    highlightItem(index) {
        let self = this;

        if (self.currentFocusIndex && self.currentFocusIndex != index) {
            self.chart.dispatchAction({ type: 'downplay', dataIndex: self.currentFocusIndex });
        }

        self.currentFocusIndex = index;
        self.chart.dispatchAction({ type: 'highlight', dataIndex: index });

        $(".rotation_item").removeClass('highlighted');
        $(".intervention").removeClass('highlighted');
        $("#rotation_" + index).addClass('highlighted');
    }

    renderHorizontal(rotationData) {
        let self = this;

        // Specify the configuration items and data for the chart
        var data = [];
    
        var categories = ['Autres interventions', 'Parcelle', 'Contrôle adventices'];
        let minDate = null;

        rotationData.forEach((item, index) => {
            let duration = (item.endDate.getFullYear() - item.startDate.getFullYear()) * 12;
            duration -= item.startDate.getMonth();
            duration += item.endDate.getMonth();
            
            if (!minDate)
                minDate = item.startDate.valueOf();

            data.push({
                name: item.name,
                value: [
                    1, // Parcelle (index de la série)
                    item.startDate.valueOf(), // Date de début
                    item.endDate.valueOf(), // Date de fin
                    item.name, // Nom
                    'rotation_item', // Type
                    duration // Durée (mois)
                ],
                itemStyle: {
                    color: item.color
                }
            });    

            if (item.interventions) {
                item.interventions.forEach((intervention) => {
   
                    data.push({
                        name: intervention.name,
                        value: [
                            intervention.type == 'Protection des plantes' ? 2 : 0, // Parcelle (index de la série)
                            item.startDate.valueOf() + intervention.day * 86400000, // Date de début (ms)
                            item.startDate.valueOf() + (intervention.day + 1) * 86400000, // Date de début (ms)
                            intervention.important === true ? intervention.name + ' 🛈' : intervention.name, // Nom
                            intervention.type == 'Protection des plantes' ? 'intervention_top' : 'intervention_bottom', // Type
                            1,
                            intervention.day
                        ],
                        itemStyle: {
                            color: item.color
                        }
                    });    
                });    
            }
        });
    
        let maxXPositions = new Map();

        function renderItem(params, api) {
            
            var categoryIndex = api.value(0);
            var start = api.coord([api.value(1), categoryIndex]);
            var end = api.coord([api.value(2), categoryIndex]);
            var name = api.value(3);
            var type = api.value(4);

            const x = start[0];
            let y = start[1];

            const style = api.style();

            if (params.context.rendered == undefined) {
                // Start of a new rendering round
                maxXPositions = new Map();

                for (let catIndex = 0; catIndex < 3; catIndex++) {
                    for (let track = 0; track < 3; track++) {
                        maxXPositions.set('track_left_' + catIndex + '_' + track, params.coordSys.width);
                    }
                }
            }

            params.context.rendered = true;

            // Remove the default emphasis style
            api.styleEmphasis({});

            if (type == 'rotation_item') {

                // start[0] // abscisse gauche de l'élément (après zoom)
                // start[1] // ordonnée gauche de l'élément
                // end[0] // abscisse droite de l'élément (après zoom)
                // end[1] // ordonnée droite de l'élément
                // height // Hauteur de l'élément

                // params.coordSys.x // début du canva
                // params.coordSys.y // début du canva
                // params.coordSys.width, // largeur du canva
                // params.coordSys.height // hauteur du canva

                const height = self.barHeight - 40; // 20 px margin top and bottom
                const arrowWidth = height / 3;
                const border = 3;
                const textMargin = 10;

                var points = [
                    [x, y - height / 2],
                    [end[0] - border, y - height / 2],
                    [end[0] + arrowWidth - border, y],
                    [end[0] - border, y + height / 2],
                    [x, y + height / 2],
                    [x + arrowWidth, y],
                ];

                const itemLabelWidth = echarts.format.getTextRect(name).width + textMargin * 2;
                const itemWidth = end[0] - x;

                if (itemLabelWidth > itemWidth)
                    name = ''; // Hide the label as we won't have the room to show it

                // See this for clip regions : https://stackoverflow.com/questions/71735038/setting-border-and-label-in-custom-apache-echarts
                // https://stackoverflow.com/questions/73653691/how-to-draw-a-custom-triangle-in-renderitem-in-apache-echarts

                return (
                    {
                        type: 'polygon',
                        transition: ['shape'],
                        shape: {
                            points: points
                        },
                        style: style,
                        emphasis: {
                            style: {
                                shadowBlur: 4,
                                shadowOffsetX: 1,
                                shadowOffsetY: 2,
                                shadowColor: 'rgba(0, 0, 0, 0.2)'
                            },
                        },
                        textConfig: {
                            position: [arrowWidth + textMargin, height / 2 - 5]
                        },
                        textContent: {
                            style: {
                                text: name,
                                fill: '#000',
                                width: 80,
                                fontWeight: 'bold'
                            }
                        }
                    }
                );
            }

            if (type == 'intervention_bottom' || type == 'intervention_top') {

                const height = 20;
                const border = 3;
                const margin = 10;
                const textMargin = 5;

                // Maintain a list of max x for each row. If the max x is further right than the label we try to push,
                // use another row. If for all rows the space is taken, just drop this item

                let trackToUse = null;
                const itemLabelWidth = echarts.format.getTextRect(name).width + textMargin * 2;

                for (let track = 0; track < 3; track++) {
                    if (!maxXPositions.has('track_right_' + categoryIndex + '_' + track)) {
                        // Situation where the track is empty
                        trackToUse = track;
                        break;
                    }

                    let trackLeft = maxXPositions.get('track_left_' + categoryIndex + '_' + track);
                    if (trackLeft > (x + itemLabelWidth)) {
                        // Situation where the drawing has started right of the current element
                        trackToUse = track;
                        break;
                    }

                    let trackRight = maxXPositions.get('track_right_' + categoryIndex + '_' + track);
                    if (trackRight < x) {
                        // Situation where the last painted element is sufficiently far on the left
                        trackToUse = track;
                        break;
                    }
                }

                if (trackToUse == null)
                    return null;

                let currentRight = maxXPositions.get('track_right_' + categoryIndex + '_' + trackToUse);
                if (currentRight == undefined || currentRight < x + itemLabelWidth)
                    maxXPositions.set('track_right_' + categoryIndex + '_' + trackToUse, x + itemLabelWidth);

                let currentLeft = maxXPositions.get('track_left_' + categoryIndex + '_' + trackToUse);
                if (currentLeft > x)
                    maxXPositions.set('track_left_' + categoryIndex + '_' + trackToUse, x);

                // A nicer solution could be to draw large items in a reduced format until there is enough space for 
                // drawing them fully. Unfortunately that would require a two pass drawing which does not exist with Echarts ?

                const arrowWidth = 3;

                let arrowTop = y + 60;
                let arrowBottom = y - 60;

                y = margin + y + trackToUse * (height + margin) - (self.barHeight / 2);

                var points = [];
                var textPosition = [];

                if (type == 'intervention_top') {
                    textPosition = [textMargin, textMargin];
                    points = [
                        [x, y],
                        [x + itemLabelWidth, y],
                        [x + itemLabelWidth, y + height],
                        [x + arrowWidth, y + height],
                        [x, arrowTop]
                    ];
                }
                else {
                    textPosition = [textMargin, textMargin + y - arrowBottom];
                    points = [
                        [x, arrowBottom],
                        [x + arrowWidth, y],
                        [x + itemLabelWidth, y],
                        [x + itemLabelWidth, y + height],
                        [x, y + height]
                    ];
                }

                return ({
                    type: 'polygon',
                    transition: ['shape'],
                    shape: {
                        points: points
                    },
                    style: api.style({
                        fill: style.fill,
                        stroke: style.fill,
                        textFill: '#000',
                    }),
                    emphasis: {
                        style: {
                            shadowBlur: 4,
                            shadowOffsetX: 1,
                            shadowOffsetY: 2,
                            shadowColor: 'rgba(0, 0, 0, 0.2)'
                        },
                    },
                    textConfig: {
                        position: textPosition
                    },
                    textContent: {
                        style: {
                            text: name,
                            fill: '#000',
                        }
                    }
                }
                );

            }
        }
        let option = {
            tooltip: {
                formatter: function (params) {
                    if (params.value[4] == 'rotation_item') {
                        let start = new Date(params.value[1]).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
                        let end = new Date(params.value[2]).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    
                        return params.marker + params.name + ' : ' + params.value[5] + ' mois (' + start + ' ➜ ' + end + ')';
                    }
                    else {
                        let interventionDate = new Date(params.value[1]);
                        const days = params.value[6];
                        let dateString = interventionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    
                        if (days >= 0)
                            dateString += ' (J+' + days + ')';
                        else
                            dateString += ' (J' + days + ')';
    
                        return params.marker + params.name + ' - ' + dateString;
                    }
                }
            },
    
            title: {
                text: 'Itinéraire technique',
                left: 'center'
            },
    
            dataZoom: [
                {
                    type: 'slider',
                    filterMode: 'weakFilter',
                    showDataShadow: false,
                    top: self.barHeight * 3 + 100,
                    labelFormatter: ''
                },
                {
                    type: 'inside',
                    filterMode: 'weakFilter'
                }
            ],
    
            grid: {
                height: self.barHeight * 3
            },
    
            xAxis: {
                min: minDate,
                type: 'time',
                axisTick: { show: true },
                axisLine: { show: true },
                splitLine: { show: true },
                axisLabel: {
                    formatter: {
                        year: '{yyyy}',
                        month: '{MMM} {yy}',
                        day: '{d} {MMM} {yy}'
                    },
                }
            },
    
            yAxis: {
                data: categories
            },
    
            series: [
                {
                    type: 'custom',
                    renderItem: renderItem,
                    clip: true,
                    itemStyle: {
                        opacity: 0.8
                    },
                    encode: {
                        x: [1, 2],
                        y: 0
                    },
                    data: data
                }
            ]
        };
    
        // Display the chart using the configuration items and data just specified.
        self.chart.setOption(option);
    
        console.log(option);
    
        self.chart.on('click', function (params) {
            let element = $("#rotation_" + params.dataIndex + " h4");
            if (element.length == 0)
                element = $("#rotation_" + params.dataIndex);
    
            self.noFocusUpdate = true;
    
            setTimeout(() => {
                self.noFocusUpdate = false;
            }, 1500);
    
            element[0].scrollIntoView({ block: "center" });
            self.highlightItem(params.dataIndex);
        });    
    }

    buildHTML(rotationData) {
        var html = '';
        let itemIndex = 0;
    
        rotationData.forEach((item, index) => {
                
            html += '<div id="rotation_' + itemIndex + '" class="rotation_item" style="border-color: ' + item.color + '">'
                + '<h4>' + item.name + '</h4>'
                + (item.description ?? '')
                + (item.attributes ? item.attributes.map((attribute) => { return '<p><dt>' + attribute.name + '</dt><dd>' + attribute.value + '</dd></p>' }).join('') : '');
    
            itemIndex++;
    
            if (item.interventions) {
                html += '<h5>Interventions</h5>';
                item.interventions.forEach((intervention) => {
                    let intDate = new Date(item.startDate.valueOf() + intervention.day * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
                    let days = intervention.day;
                    if (days >= 0)
                        intDate += ' (J+' + days + ')';
                    else
                        intDate += ' (J' + days + ')';
    
                    let title = intervention.name;
    
                    if (intervention.important === true)
                        title = '<i class="fa fa-exclamation-circle" aria-hidden="true" style="color: #ff9a1c"></i> ' + title;
    
                    html += '<div id="rotation_' + itemIndex + '" class="intervention"><span class="intervention_title">' + title + '</span>'
                        + '<span class="intervention_date badge rounded-pill">' + intDate + '</span>'
                        + '<div class="intervention_description">' + intervention.description + '</div></div>';
    
                    itemIndex++;
    
                });
    
            }
    
            html += '</div>';
        });
    
        return html;
    }
}
