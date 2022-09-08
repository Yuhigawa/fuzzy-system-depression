#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import gradient from 'gradient-string';
import chalkAnimation from 'chalk-animation';
import figlet from 'figlet';
import { createSpinner } from 'nanospinner';

import fs from 'fs';

const s_timeout = (ms=4000) => new Promise( r => setTimeout(r, ms) )
let respostas = [];

const cases = async (answers) => {
    if( (Object.entries(answers[0])[0][1] == 'NAO') && (Object.entries(answers[1])[0][1] == 'NAO') ) {
        return 0;
    }

    else if( (Object.entries(answers[0])[0][1] == 'NAO') && (Object.entries(answers[1])[0][1] == 'SIM') || 
             (Object.entries(answers[0])[0][1] == 'SIM') && (Object.entries(answers[1])[0][1] == 'NAO') ) 
        {
        return 0;
    }
    
    let _r = await questions(null, '99');
    if(_r == 0) return 0;

    respostas.push({'99': _r})
    return 1;
}

const read_file = async () => {
    const j_data = JSON.parse(fs.readFileSync('./src/assets/questions.json', 'utf-8'));
    const rules_r = JSON.parse(fs.readFileSync('./src/assets/rules.json', 'utf-8'));

    for(let type_r in rules_r) {
        let counter = 0;
        let yes_counter = 0;
        let no_counter = 0;

        if( respostas.length == 2 ) {
            let r_c = await cases(respostas);
            if( r_c == 0 ) {
                console.log('Você não caracteriza ter os sintomas de Transtorno de Depressão Maior(TDM)');
                return;
            };
        }
        
        for(let item in rules_r[type_r]) {
            let q_r = await questions(rules_r[type_r][item], type_r);
            let response = await rules_questions( q_r, counter, yes_counter, no_counter );

            counter = response[0];
            yes_counter = response[1];
            no_counter = response[2];

            let rule_return = await rule(counter, yes_counter, no_counter, rules_r[type_r].length);

            if( rule_return == 1 || rule_return == 0 ) { 
                let r_slt = await metrics(rule_return);
                let type = String(type_r);
                let aux = {};
                aux[type] = r_slt;
                respostas.push(aux);

                break;
            }
        }
    }

    respostas = respostas;

    diagnostic(respostas);
}

const rules_questions = async(answer, counter, yes_counter, no_counter) => {
    if( Object.entries(answer)[0][1] == 'Sim') { 
        if(yes_counter != null) 
            yes_counter += 1 
    }
    else if( Object.entries(answer)[0][1] == 'Não') { 
        if(yes_counter != null) 
            no_counter += 1 
    }
    else { 
        if(yes_counter != null) 
            yes_counter += 0.5 
    }

    if(counter != null) counter += 1;

    return [counter, yes_counter, no_counter]
}

const rule = (counter, yes_counter, no_counter, leng) => {
    const type_len = (() => {
        if(leng%2 == 1) return Math.floor(leng/2) + 1;
        else return leng/2;
    })();

    if( yes_counter >= type_len ) return 1;
    else if( no_counter >= type_len ) return 0;
    else return -1;
}

const sum = (array, length) => {
    let counter = 0;

    for(let item of array) counter += item;

    return counter/length
}

const metrics = async (data) => {
    if( data == 1 ) return 'SIM';
    else if( data == 0 ) return 'NAO';
}

const diagnostic = (answers) => {
    let sintoms_counter = 0;

    for(let item in answers)
        if( ![0, 1, 2].includes(Number(item)) )
            if( Object.entries(answers[item])[0][1] == 'SIM' ) sintoms_counter += 1;

    if( sintoms_counter == 2 ) console.log(`Você apresenta caracteristicas Transtorno de Depressão Maior(TDM) com grau de ${chalk.bgYellow('Depressão Leve')}`)
    else if( sintoms_counter > 2 && sintoms_counter <= 4 ) console.log(`Você apresenta caracteristicas Transtorno de Depressão Maior(TDM) com grau de ${chalk.bgMagenta('Depressão Moderada')}`)
    else if( sintoms_counter > 4) console.log(`Você apresenta caracteristicas Transtorno de Depressão Maior(TDM) com grau de ${chalk.bgRed('Depressão Grave')}`)
    else console.log('Nao categorizado')

    console.log(`Considere ligar para ${chalk.yellow('188')} e conversar com um especialista que possa te auxiliar.`);
}

const questions = async(q, index) => {
    if( index == '99' ) {
        const answers = await inquirer.prompt({
            name: '99',
            type: 'list',
            message: `Baseado nas respostas marcadas com ${chalk.bgGreenBright('Sim')}, há quanto tempo sente esses sintomas?`,
            choices: [
                "Menos de duas semanas",
                "Duas semanas ou mais",
                "Durante dois anos ou mais"
            ]
        })

        if( Object.entries(answers)[0][1] == "Menos de duas semanas" ) return 0;
        else if( Object.entries(answers)[0][1] == "Duas semanas ou mais" ) return 1;
        else return 2;
    }

    return await inquirer.prompt({
        name: index,
        type: 'list',
        message: q,
        choices: [
            'Sim',
            'Não',
            'As Vezes'
        ]
    })
}

(async () => {
    const welcome = chalkAnimation.karaoke('Pre-Diagnostico para o Transtorno de Depressão Maior \n')
    await s_timeout();
    welcome.stop();

    read_file()
})();