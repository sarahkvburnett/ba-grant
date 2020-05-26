import React, {useState, useEffect} from 'react';
import Slideshow from '../components/Slideshow'

const QualtricsIntro = () => {
    const [ json, setJson ] = useState([]);

    const startStep = {
        "name": "Getting starting with Qualtrics",
        "image": "./images/qualtrics/qualtrics-login.png",
        "description": [
           "The following information details how to login and navigate around Qualtrics",
           "This outlines the basic use of Qualtrics for the screening survey for part 1 of the study.",
           "After this, for more information on extracting the data see separate tutorial here.",
           "For more information see the Qualtrics support pages",
           "Click 'Next' to get started"
        ]
    }

    useEffect( () => {
        fetch('./json/qualtricsintro.json')
        .then(response => response.json())
        .then(data => setJson(data))
        .catch(err => console.log(err))
    }, [])

    return (
        <Slideshow json={json} startStep={startStep}/>
    )
}

export default QualtricsIntro;
