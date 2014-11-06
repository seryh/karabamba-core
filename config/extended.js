module.exports = function(app, libs, appInfo) {
  
    Date.prototype.toRFC3339LocaleString = function(showMillis){
      toPaddedString = function(num, len , fillchar) {
        var result = num.toString();
        if(typeof(fillchar) == 'undefined'){ fillchar = '0' };
        while(result.length < len){ result = fillchar + result; };
        return result;
      };
      showMillis = (typeof showMillis == 'undefined') ? true : showMillis;
      var dSep = '-';
      var tSep = ':';
      var result = this.getFullYear().toString();
      result += dSep + toPaddedString((this.getMonth() + 1),2);
      result += dSep + toPaddedString(this.getDate(),2);
      result += 'T' + toPaddedString(this.getHours(), 2);
      result += tSep + toPaddedString(this.getMinutes(),2);
      result += tSep + toPaddedString(this.getSeconds(),2);
      if((!showMillis)&&(this.getMilliseconds()>0)) result += '.' + toPaddedString(this.getMilliseconds(),3);
      var tzOffset = -this.getTimezoneOffset();
      result += ( tzOffset<0 ? '-' : '+' );
      tzOffset = tzOffset<0 ? tzOffset*(-1) : tzOffset;
      result += toPaddedString((tzOffset/60),2);
      result += tSep + toPaddedString((tzOffset%60),2);
      return result;
    };

    
};

