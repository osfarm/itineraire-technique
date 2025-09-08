
class RotationRenderer {
    constructor(divID, transcriptDivID, rotationData) {
        this.barHeight = 100;

        this.currentFocusIndex = null;
        this.noFocusUpdate = false;

        this.chart = null;

        this.chartIndex = new Map();

        if (Array.isArray(rotationData)) {
            this.hasTimeline = true;
            rotationData = rotationData.map((item) => {
                return this.fixRotationData(item);
            });
            this.chartOptions = rotationData[0].options;
        }
        else {
            this.hasTimeline = false;
            rotationData = this.fixRotationData(rotationData);
            this.chartOptions = rotationData.options;
        }

        this.initialLayout = this.chartOptions.view ?? 'horizontal';

        this.data = rotationData;

        this.divID = divID;
        this.transcriptDivID = transcriptDivID;
    }

    fixRotationData(rotationData) {
        if (rotationData.options == undefined)
            rotationData.options = {};

        if (rotationData.options?.view == undefined || rotationData?.options?.view == '')
            rotationData.options.view = 'horizontal';

        // Map rotationData items to make sure that the startDate and endDate are proper Date objects
        rotationData.steps.map((item) => {
            item.startDate = new Date(item.startDate);
            item.endDate = new Date(item.endDate);

            // Add a duration in months
            item.duration = Math.round((item.endDate - item.startDate) / (30 * 1000 * 60 * 60 * 24));

            return item;
        });

        return rotationData;
    }

    render() {

        let self = this;

        // Initialize the echarts instance based on the prepared dom
        self.chart = echarts.init(document.getElementById(self.divID));

        self.renderChart();

        if (self.data.options.show_transcript) {
            var html = this.buildHTML();
            $('#' + self.transcriptDivID).html(html);

            $('#' + self.transcriptDivID + " .rotation_item").on("click", function () {
                $(this).toggleClass('show-all');
            });

            $('#' + self.transcriptDivID + " .rotation_item").on("mouseover", function () {
                self.highlightItem(this.id);
            });

            // Add a click event on the transcript to scroll to the corresponding item in the chart
            $('#' + self.transcriptDivID + " .intervention").on('mouseover', function (e) {
                self.highlightItem(this.id);
                e.stopPropagation();
            });
        }
        else
            $('#' + self.transcriptDivID).hide();

        // resize all charts when the windows is resized
        $(window).on('resize', _.debounce(function () {
            $(".charts").each(function () {
                var id = $(this).attr('_echarts_instance_');
                window.echarts.getInstanceById(id).resize();
            });
        }, 500));
    }

    renderChart() {
        let self = this;
        let option;

        this.currentFocusIndex = null;
        this.noFocusUpdate = false;

        if (self.initialLayout == 'horizontal')
            option = this.getStepsOption();
        else
            option = this.getDonutOption();

        self.chart.clear();
        self.chart.setOption(option, false);

        // console.log(option);

        let options = this.chart.getOption();
        options.series[0].data.forEach((item, index) => {
            if (item.divId != undefined)
                self.chartIndex.set(item.divId, index);
        });

        // Add a click event on the chart to scroll to the corresponding item in the transcript
        self.chart.on('click', function (params) {
            if (!params.data.divId)
                return;

            let element = $("#" + params.data.divId + " h4");
            if (element.length == 0)
                element = $("#" + params.data.divId);

            self.noFocusUpdate = true;

            setTimeout(() => {
                self.noFocusUpdate = false;
            }, 1500);

            element[0].scrollIntoView({ block: "start" });

            $("#" + params.data.divId).toggleClass("show-all");

            self.highlightItem(params.data.divId);
        });
    }

    highlightItem(divID) {
        let self = this;

        let index = self.chartIndex.get(divID);
        if (index === undefined)
            return;

        if (self.currentFocusIndex !== null && self.currentFocusIndex != index) {
            self.chart.dispatchAction({ type: 'downplay', dataIndex: self.currentFocusIndex });
        }

        self.currentFocusIndex = index;
        self.chart.dispatchAction({ type: 'highlight', dataIndex: index });

        $(".rotation_item").removeClass('highlighted');
        $(".intervention").removeClass('highlighted');
        $('#' + divID).addClass('highlighted');
    }

    getStepsOption() {
        let self = this;

        // Specify the configuration items and data for the chart
        var categories = self.getCategoriesLabels();

        let minMaxDates = {};

        if (self.hasTimeline)
            minMaxDates = self.getMinMaxDates(self.data[0].steps);
        else
            minMaxDates = self.getMinMaxDates(self.data.steps);

        let option = self.getDefaultOption({
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
                height: self.barHeight * 3,
                right: 6
            },

            xAxis: {
                min: minMaxDates.min,
                max: minMaxDates.max,
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
                data: categories,
                axisLabel: {
                    width: 100,
                }
            },

            series: []
        });

        if (self.hasTimeline) {
            option.series = self.getStepsSeries(self.data[0].steps);
            option.options = [];

            self.data.forEach((item) => {
                option.options.push({
                    series: self.getStepsSeries(item.steps)
                    // ,
                    // title: item.timelineTitle ?? item.title
                });
            }
            );
        } else {
            option.series = self.getStepsSeries(self.data.steps);
        }

        return option;
    }

    getMinMaxDates(steps) {
        let minDate = null;
        let maxDate = null;

        steps.forEach((item) => {
            if (!minDate || minDate > item.startDate.valueOf())
                minDate = item.startDate.valueOf();

            if (!maxDate || maxDate < item.endDate.valueOf())
                maxDate = item.endDate.valueOf() + 86400000 * 30; // Add some space for the end of the arrow
        });

        return { min: minDate, max: maxDate };
    }

    getStepsSeries(steps) {
        let self = this;
        let data = [];

        steps.forEach((item, index) => {
            if (item.name == Number(item.name))
                item.name = "Etape " + item.name; // Force the item name to be a string

            data.push({
                name: item.name,
                divId: 'Step_' + index,
                type: 'rotation_item',
                startDate: new Date(item.startDate.valueOf()), // Date de début
                endDate: new Date(item.endDate.valueOf()), // Date de fin
                duration: item.duration,
                description: (item.description ?? ''),
                value: [
                    1, // Parcelle (index de la série)
                    item.startDate.valueOf(), // Date de début
                    item.endDate.valueOf(), // Date de fin
                    item.name, // Nom
                    'rotation_item' // Type
                ],
                itemStyle: {
                    color: item.color
                }
            });

            if (item.interventions) {
                item.interventions.forEach((intervention, interventionIndex) => {

                    data.push({
                        name: intervention.name,
                        type: intervention.type,
                        value: [
                            intervention.type == 'intervention_top' ? 2 : 0, // Interventions en haut ou en bas (index de la série)
                            item.startDate.valueOf() + Number(intervention.day) * 86400000, // Date de début (ms)
                            item.startDate.valueOf() + (Number(intervention.day) + 1) * 86400000, // Date de début (ms)
                            intervention.important === true ? intervention.name + ' 🛈' : intervention.name, // Nom
                            intervention.type == 'intervention_top' ? 'intervention_top' : 'intervention_bottom' // Type
                        ],
                        divId: 'Intervention_' + index + '_' + interventionIndex,
                        interventionDate: new Date(item.startDate.valueOf()),
                        interventionDays: intervention.day,
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
            style.opacity = 0.5;

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

        return [
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
            ];
    }

    getCategoriesLabels() {
        let self = this;

        let categories = [self.chartOptions.title_bottom_interventions ?? '',
                          self.chartOptions.title_steps ?? '',
                          self.chartOptions.title_top_interventions ?? ''];

        // simulate some wrapping of the category labels
        categories = categories.map((item) => {
            return Array.from(item.matchAll(/(?=\S).{0,13}\S(?!\S)|\S{7}/gm), (m) => m[0]).join("\n");
        });

        return categories;
    }

    buildHTML() {
        let html = '';

        let self = this;

        self.data.steps.forEach((item, index) => {

            let collapseButton = '';
            if (item.interventions?.length > 0 || item.attributes?.length > 0)
                collapseButton = '<div class="collapse-button"><i class="fa fa-chevron-down" aria-hidden="true"></i></div>';

            let start = item.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });
            let end = item.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });

            let dates = '<b>' + item.duration + ' mois</b> (' + start + ' ➜ ' + end + ')';

            html += '<div id="Step_' + index + '" class="rotation_item" style="border-color: ' + item.color + '">'
                + '<div class="step_dates">' + dates + '</div>'
                + '<h4>' + item.name + '<i class="fa fa-pencil step-edit" aria-hidden="true"></i></h4>'
                + collapseButton
                + '<p class="step_description">' + (item.description ?? '') + '</p>'
                + '<div class="details">'
                + (item.attributes?.length > 0 ? item.attributes.map((attribute) => { return '<p><dt>' + attribute.name + '</dt><dd>' + attribute.value + '</dd></p>' }).join('') : '');

            if (item.interventions?.length > 0) {
                html += '<h5>Interventions</h5>';
                item.interventions.forEach((intervention, interventionIndex) => {
                    let intDate = new Date(item.startDate.valueOf() + intervention.day * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
                    let days = intervention.day;
                    if (days >= 0)
                        intDate += ' (J+' + days + ')';
                    else
                        intDate += ' (J' + days + ')';

                    let title = intervention.name;

                    if (intervention.important === true)
                        title = '<i class="fa fa-exclamation-circle" aria-hidden="true" style="color: #ff9a1c"></i> ' + title;

                    html += '<div id="Intervention_' + index + '_' + interventionIndex + '" class="intervention"><span class="intervention_title">' + title + '</span>'
                        + '<span class="intervention_date badge rounded-pill">' + intDate + '</span>'
                        + '<div class="intervention_description">' + intervention.description + '</div></div>';
                });
            }

            html += '</div></div>';
        });

        return '<div>' + html + '</div>';
    }

    getDonutOption() {
        let self = this;

        let option = self.getDefaultOption({
        });

        if (self.hasTimeline) {
            option.series = this.getDonutSeries(self.data[0].steps);
            option.options = [];
            self.data.forEach((item) => {
                option.options.series = this.getDonutSeries(item.steps);
            });
        }
        else {
            option.series = this.getDonutSeries(self.data.steps);
        }

        return option;
    }

    getDonutSeries(steps) {
        let series = [];
        let self = this;

        // Build the crop ring
        let crops = {
            name: 'Rotation',
            type: 'pie',
            top: '40',
            radius: ['70%', '100%'],
            labelLine: {
                length: 30
            },
            label: {
                position: 'inner',
                fontWeight: 'bold'
            },
            data: []
        };

        let totalMonths = 0;
        let minDate = null;
        let lastDayOfPreviousStep = null;

        steps.forEach((item, index) => {

            totalMonths += item.duration;

            if (!lastDayOfPreviousStep)
                lastDayOfPreviousStep = new Date(item.startDate.valueOf());

            let days = Math.round((item.endDate - lastDayOfPreviousStep) / (1000 * 60 * 60 * 24));
            lastDayOfPreviousStep = new Date(item.endDate.valueOf());

            if (!minDate)
                minDate = new Date(item.startDate.valueOf());

            let pieItem = {
                'name': item.name,
                'value': days,
                'divId': 'Step_' + index,
                'type': 'rotation_item',
                'startDate': new Date(item.startDate.valueOf()), // Date de début
                'endDate': new Date(item.endDate.valueOf()), // Date de fin
                'duration': item.duration,
                'description': (item.description ?? '')// + (item.attributes ? item.attributes.map((attribute) => { return '<p><dt>' + attribute.name + '</dt><dd>' + attribute.value + '</dd></p>' }).join('') : '')
            };

            if (pieItem.color != '#ffffff')
                pieItem.itemStyle = { 'color': item.color };

            crops.data.push(pieItem);
        });

        series.push(crops);

        // Create the calendar ring
        let months = {
            name: 'Months',
            type: 'pie',
            top: '40',
            radius: ['60%', '70%'],
            label: {
                position: 'inner',
                rotate: 'tangential'
            },
            tooltip: {
                show: true,
                formatter: '{b}'
            },
            itemStyle: {
                borderColor: '#555',
                color: '#FFFFFF',
                borderWidth: 0
            },
            emphasis: { disabled: true },
            data: []
        };

        const monthsColorScale = [
            '#c7d2e3', // winter
            '#c7d2e3',
            '#bdd8c0', // spring
            '#bdd8c0',
            '#bdd8c0',
            '#ecebb3', // summer
            '#ecebb3',
            '#ecebb3',
            '#f8e0c5', // automn
            '#f8e0c5',
            '#f8e0c5',
            '#c7d2e3'
        ];

        let monthsPerYear = new Map();
        for (let month = 1; month <= totalMonths; month++) {
            let monthName = minDate.toLocaleDateString(undefined, { month: 'short' });

            let item = { 'name': monthName, 'value': 1 };
            const year = minDate.getFullYear();

            item.itemStyle = { color: monthsColorScale[minDate.getMonth()] };

            months.data.push(item);

            let currentMonthsPerYear = monthsPerYear.get(year);
            if (currentMonthsPerYear == undefined)
                currentMonthsPerYear = 0;
            monthsPerYear.set(year, ++currentMonthsPerYear);

            // increment the current month
            minDate.setMonth(minDate.getMonth() + 1);
        }

        series.push(months);

        // Create the calendar years ring
        let years = {
            name: 'Years',
            type: 'pie',
            top: '40',
            radius: ['45%', '60%'],
            label: {
                position: 'inner',
                rotate: 'tangential',
                fontWeight: 'bold'
            },
            emphasis: { disabled: true },
            tooltip: { show: false },
            itemStyle: {
                color: '#FFFFFF',
                borderWidth: 1
            },
            data: []
        };

        monthsPerYear.forEach((nbMonths, year) => {
            years.data.push({ 'name': year, 'value': nbMonths });
        });

        series.push(years);

        return series;
    }

    getDefaultOption(option) {

        let self = this;

        option.title = {
            text: self.data.title,
            left: 'center'
        };

        if (Array.isArray(self.data) && self.hasTimeline) {
            option.timeline = {
                axisType: 'category',
                // realtime: false,
                // loop: false,
                autoPlay: true,
                top: self.barHeight * 3 + 150,
                // currentIndex: 2,
                playInterval: 5000,
                replaceMerge: 'series',

                // controlStyle: {
                //     position: 'left'
                // },
                data: [],
            };

            self.data.forEach((item) => {
                option.timeline.data.push(item.timelineTitle ?? item.title);
            });
        }

        option.tooltip = {
                formatter: function (params) {
                    if (params.data.type == 'rotation_item') {
                        let start = params.data.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });
                        let end = params.data.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });

                        return params.marker + params.name + ' : ' + params.data.duration + ' mois (' + start + ' ➜ ' + end + ')<br>' + params.data.description;
                    }
                    else {
                        let interventionDate = params.data.interventionDate;
                        const days = params.data.interventionDays;
                        let dateString = interventionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

                        if (days >= 0)
                            dateString += ' (J+' + days + ')';
                        else
                            dateString += ' (J' + days + ')';

                        return params.marker + params.name + ' - ' + dateString;
                    }
                }
            };

        option.toolbox = {
                "itemSize": 25,
                "iconStyle": {
                    "borderColor": "#AAA",
                    "borderWidth": 1
                },
                "feature": {
                    "myTool1": {
                        "show": true,
                        "title": 'Rotation',
                        "icon": 'path://M18.15,12.99c-.06-.07-.14-.13-.23-.17l-.38-.15c.33-.93.51-1.92.51-2.96,0-3-1.49-5.65-3.77-7.26l-3.03,2.72c1.72.79,2.91,2.53,2.91,4.54,0,.54-.09,1.07-.25,1.56l-.44-.17c-.3-.12-.64.03-.76.33-.04.1-.05.21-.03.31l.79,4.82c.06.32.36.53.68.47.1-.02.19-.06.27-.13l3.66-3.1c.25-.21.28-.58.07-.82ZM6.94,5.24c.46-.23.97-.39,1.5-.47l.13.59c.07.32.38.52.69.45.1-.02.2-.07.28-.14l3.59-3.31c.23-.22.24-.59.02-.83-.07-.07-.16-.13-.26-.16L8.3.02c-.31-.09-.63.09-.73.39-.03.09-.03.19-.01.29l.06.27c-1.12.2-2.16.6-3.1,1.17l2.41,3.09ZM5.88,5.96l-2.39-3.06c-.98.82-1.79,1.84-2.34,3.01l3.62,1.44c.29-.53.66-1,1.11-1.39ZM4.17,9.72c0-.41.05-.81.14-1.19l-3.63-1.44c-.18.57-.3,1.16-.35,1.77l3.84,1.1c0-.08,0-.16,0-.24ZM9.17,14.72c-1.59,0-3-.74-3.92-1.9l.42-.38c.24-.22.26-.59.04-.83-.07-.08-.16-.14-.26-.17l-4.66-1.47c-.31-.09-.64.08-.73.39-.03.1-.03.2,0,.3l1.12,4.66c.07.31.39.51.7.43.09-.02.18-.07.25-.13l.23-.21c1.63,1.94,4.07,3.18,6.8,3.18,1.3,0,2.54-.28,3.66-.79l-.8-3.99c-.81.56-1.79.9-2.86.9Z',
                        onclick: function (){
                            self.initialLayout = 'donut';
                            self.renderChart();
                        }
                    },
                    "myTool2": {
                        "show": true,
                        "title": 'Frise',
                        "icon": 'path://M4.63,0H0v10.01h4.97c.07,0,.13-.05.19-.14l2.61-4.14c.17-.28.23-.89.12-1.35-.03-.15-.08-.27-.13-.35L5.16.12c-.05-.08-.11-.12-.17-.12h-.37ZM11.9,4.38c-.03-.15-.08-.27-.13-.35L9.17.12c-.05-.08-.11-.12-.17-.12h-.37s-2.26,0-2.26,0v.03s.06.05.08.09l2.6,3.9c.06.08.1.21.13.35.1.47.05,1.07-.12,1.35l-2.61,4.14s-.05.07-.08.09v.04h2.6c.07,0,.13-.05.19-.14l2.61-4.14c.17-.28.23-.89.12-1.35ZM18.28,4.38c-.03-.15-.08-.27-.13-.35L15.55.12c-.05-.08-.11-.12-.17-.12h-.37s-4.63,0-4.63,0v.03s.06.05.08.09l2.6,3.9c.06.08.1.21.13.35.1.47.05,1.07-.12,1.35l-2.61,4.14s-.05.07-.08.09v.04h4.97c.07,0,.13-.05.19-.14l2.61-4.14c.17-.28.23-.89.12-1.35Z',
                        onclick: function (){
                            self.initialLayout = 'horizontal';
                            self.renderChart();
                        }
                    },
                    "saveAsImage": {
                        'excludeComponents': ["dataZoom", "toolbox"]
                    }
                }
            };

        return option;
    }
}
