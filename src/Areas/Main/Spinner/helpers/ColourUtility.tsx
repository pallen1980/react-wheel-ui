
//const ColourUtility = () => {

    const colours = [
        '#CC4629', // Darker vibrant orange
        '#CC9A29', // Darker bright yellow
        '#B2CC29', // Darker light green-yellow
        '#5ECC29', // Darker bright green
        '#29CC46', // Darker bright teal-green
        '#29CC99', // Darker turquoise
        '#2985CC', // Darker sky blue
        '#293FCC', // Darker bright blue
        '#4629CC', // Darker purple
        '#9929CC', // Darker violet
        '#CC2981', // Darker hot pink
        '#CC2929', // Darker red
        '#CC5929', // Darker coral
        '#CC9529', // Darker gold
        '#B2CC29', // Darker lime green
        '#66CC29', // Darker olive green
        '#29CC5F', // Darker mint green
        '#29CC91', // Darker pale turquoise
        '#298ECC', // Darker deep sky blue
        '#4A29CC', // Darker royal blue
        '#8429CC', // Darker medium purple
        '#CC298F', // Darker fuchsia
        '#CC294F', // Darker hot pink
    ];

    const darkenColour = (colour: string, amount: number): string => {
        let r = parseInt(colour.slice(1, 3), 16);
        let g = parseInt(colour.slice(3, 5), 16);
        let b = parseInt(colour.slice(5, 7), 16);

        r = Math.max(0, r - amount);
        g = Math.max(0, g - amount);
        b = Math.max(0, b - amount);

        return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
    };

//}

export { colours, darkenColour };
