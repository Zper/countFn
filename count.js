// import Big from './big';

function getType (obj)
{
  // tostring会返回对应不同的标签的构造函数
  let toString = Object.prototype.toString;
  let map = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object'
  };
  if (obj instanceof Element)
  {
    return 'element';
  }
  return map[toString.call(obj)];
}
// 深度克隆
function deepClone (data)
{
  let type = getType(data);
  let obj;
  if (type === 'array')
  {
    obj = [];
  }
  else if (type === 'object')
  {
    obj = {};
  }
  else
  {
    // 不再具有下一层次
    return data;
  }
  if (type === 'array')
  {
    for (let i = 0, len = data.length; i < len; i++)
    {
      obj.push(deepClone(data[i]));
    }
  }
  else if (type === 'object')
  {
    for (let key in data)
    {
      obj[key] = deepClone(data[key]);
    }
  }
  return obj;
}
// 转化成适合计算的格式
function formatFormula (countStr)
{
  let filterNull = (arr) =>
  {
    return arr.filter(m => m && m.trim());
  };
  let countArr = countStr.split('');
  let operator = ['(', ')', '+', '-', '*', '/', '%'];
  let formatArr = filterNull(countArr);
  let str = formatArr.join('');
  operator.forEach(n =>
  {
    str = str.replace(new RegExp(n === '%' ? n : `\\${n}`, 'g'), ` ${n} `);
  });
  let result = filterNull(str.trim().split(' '));
  let formatResult = [];
  // 负数会出现的意外情况， 比如['12', '/', '-', '4'], -4被切割成两个了
  let negativeIndex = -1; // 负数的index
  result.forEach((m, index) =>
  {
    if (m === '-')
    {
      // 如果-号之前还是操作符，这个-号就是负数标识
      negativeIndex = ['+', '-', '*', '/', '%'].includes(result[index - 1]) ? index : -1;
    }
    formatResult.push(m);
  });
  if (negativeIndex > -1)
  {
    // 把负数合并回一个值
    formatResult.splice(negativeIndex, 2, result[negativeIndex] + result[negativeIndex + 1]);
  }
  return formatResult;
}
// 先计算括号内的，把得到的结果替换原来括号的内容
function simplifyCount (arrayStr)
{
  let rawArrayStr = deepClone(arrayStr);
  if (arrayStr.indexOf(')') > 0)
  {
    let countLastIndex = arrayStr.indexOf(')');
    let aStr = arrayStr.substring(0, countLastIndex + 1);
    let countStartIndex = aStr.lastIndexOf('(');
    let bStr = aStr.substring(countStartIndex);
    let replaceStr = bStr;
    let countStr = bStr.substring(1, bStr.length - 1);
    let result = countFn(formatFormula(countStr));
    rawArrayStr = rawArrayStr.replace(replaceStr, String(result));
    return simplifyCount(rawArrayStr);
  }
  else
  {
    return arrayStr;
  }
}
/**
 * 四则运算（高精度）
 * array - 数组, 如[1,'+',2,'*',3]
 * num - 保留小数位数
 * @author lizipei
 * @date 2019/9/21
 */
const countFn = function (array, num)
{
  /* 括号内的先计算 */
  if (array.includes('('))
  {
    let arrayStr = simplifyCount(array.join(''));
    array = formatFormula(arrayStr);
  }
  let result;
  // eslint-disable-next-line no-unused-vars
  let bigNum = (value) =>
  {
    return new Big(value);
  };
  let insertStr = (sourse, start, newStr) =>
  {
    return sourse.slice(0, start) + newStr + sourse.slice(start);
  };
  let countStr = '';
  array.forEach(m =>
  {
    if (m === '(' || m === ')')
    {
      countStr += m;
    }
    if (m === '+')
    {
      countStr += '.plus()';
    }
    if (m === '-')
    {
      countStr += '.minus()';
    }
    if (m === '*')
    {
      countStr += '.times()';
    }
    if (m === '/')
    {
      countStr += '.div()';
    }
    if (m === '%')
    {
      countStr += '.mod()';
    }
    if (m !== '+' && m !== '-' && m !== '*' && m !== '/' && m !== '%' && m !== '(' && m !== ')')
    {
      m = !(isNaN(m) || isNaN(Number(m))) ? Number(m) : 0;
      m = m === 0 ? `bigNum('0')` : `bigNum(${m})`;
      let lastIndex = countStr.lastIndexOf('(') > -1 ? countStr.lastIndexOf('(') : 0;
      countStr = insertStr(countStr, lastIndex + 1, m);
    }
  });
  // 因为除以0会报错，而且Infinity当成0来显示，所以除以0的时候默认当作乘以0
  if (countStr.indexOf(`.div(bigNum('0'))`))
  {
    countStr = countStr.replace(/\.div\(bigNum\('0'\)\)/g, `.times(bigNum('0'))`);
  }
  if (num)
  {
    countStr += `.toFixed(${Number(num)})`;
  }
  else
  {
    countStr += '.toString()';
  }
  try
  {
    result = eval(countStr);
  }
  catch (e)
  {
    console.log(e);
    // console.log('计算公式有误', array, countStr);
  }
  return Number(result || 0);
};

// export default {
//   countFn
// }
