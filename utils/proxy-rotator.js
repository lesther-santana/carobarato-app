import { load } from "cheerio";
import axios from 'axios'
export const getProxies = async () => {


    let ip_addresses = [];
    let port_numbers = [];

    const response = await axios.get('https://sslproxies.org/');
    const $ = load(response.data);

    $("td:nth-child(1)").each(function (index, value) {
        ip_addresses[index] = $(this).text();
    });

    $("td:nth-child(2)").each(function (index, value) {
        port_numbers[index] = $(this).text();
    });

    ip_addresses.join(", ");
    port_numbers.join(", ");


    return { ip_addresses, port_numbers }

}