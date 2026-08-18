(function(){
  var reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

  var navToggle=document.querySelector(".nav-toggle");
  var navLinks=document.querySelector(".nav-links");
  if(navToggle&&navLinks){
    navToggle.addEventListener("click",function(){
      var open=navLinks.classList.toggle("open");
      navToggle.textContent=open?"\u00d7":"\u2630";
    });
  }

  /* scroll progress */
  var scrolly=document.createElement("div");
  scrolly.className="scrolly";
  scrolly.setAttribute("aria-hidden","true");
  document.body.appendChild(scrolly);
  function onScroll(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    var p=h>0?(window.scrollY||document.documentElement.scrollTop)/h:0;
    scrolly.style.transform="scaleX("+p.toFixed(4)+")";
  }
  if(reduced){scrolly.style.display="none"}
  else{
    window.addEventListener("scroll",onScroll,{passive:true});
    onScroll();
  }

  /* hunt trace spine */
  var spine=document.getElementById("spine");
  if(spine){
    var dots=[] ,n=416,flip=Math.floor(n*0.58);
    for(var s=0;s<n;s++){
      var cell=document.createElement("i");
      if(s===flip){cell.className="hot"}
      else if(s<flip){cell.className="done"}
      spine.appendChild(cell);
    }
  }

  /* reveal scan */
  var revealEls=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    },{threshold:.12});
    revealEls.forEach(function(el){
      var r=el.getBoundingClientRect();
      if(r.top<window.innerHeight&&r.bottom>0){
        el.classList.add("in-view");
      }else{
        io.observe(el);
      }
    });
  }else{
    revealEls.forEach(function(el){el.classList.add("in-view")});
  }

  /* hero terminal types the command then boots output lines */
  var term=document.querySelector(".hero-term");
  if(term&&!("IntersectionObserver" in window)){
    term.classList.add("typed");
  }else if(term&&!reduced){
    var cmd=term.querySelector(".cmd-line .cmd");
    var body=term.querySelector(".term-body");
    var full=cmd?cmd.textContent:"";
    var html=cmd?cmd.innerHTML:"";
    var kids=body?[].slice.call(body.children):[];
    var boot=function(){
      if(term.classList.contains("typed"))return;
      term.classList.add("boot");
      if(cmd)cmd.textContent="";
      var i=0;
      var iv=setInterval(function(){
        if(cmd)cmd.textContent=full.slice(0,++i);
        if(i>=full.length){
          clearInterval(iv);
          for(var k=1;k<kids.length;k++){
            kids[k].style.animationDelay=(.1+k*.15).toFixed(2)+"s";
          }
          if(cmd)cmd.innerHTML=html;
          term.classList.add("typed");
          term.classList.remove("boot");
        }
      },24);
    };
    if(term.classList.contains("in-view")){
      boot();
    }else{
      var io2=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){
            boot();
            io2.disconnect();
          }
        });
      },{threshold:.35});
      io2.observe(term);
    }
  }

  document.querySelectorAll(".form").forEach(function(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var email=form.querySelector("input[type=email]");
      var stack=form.querySelector("select[name=stack]");
      var ok=form.querySelector(".form-ok");
      var err=form.querySelector(".form-err");
      if(!email||!email.value||!/\S+@\S+\.\S+/.test(email.value)){
        if(err){err.textContent="Enter a real email address."}
        return;
      }
      var body={email:email.value.trim()};
      if(stack&&stack.value){body.provider=stack.value}
      fetch("https://api.ec.emcognito.com/subscribe",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "X-Publishable-Key":"YOUR_PUBLISHABLE_KEY"
        },
        body:JSON.stringify(body)
      }).then(function(res){
        if(res.status===201){form.classList.add("is-sent")}
        else{return res.json().then(function(j){throw new Error(j.detail||"try again")})}
      }).catch(function(){
        if(err){err.textContent="Something went wrong. Try again."}
      });
    });
  });

  /* text scramble on nav links and buttons */
  if(!reduced){
    var SCR="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789#+";
    function scramble(target){
      var txt=target.getAttribute("data-txt");
      if(txt===null){txt=target.textContent;target.setAttribute("data-txt",txt)}
      target.textContent=txt;
      var frames=7,i=1;
      var iv=setInterval(function(){
        var out="",j;
        for(j=0;j<txt.length;j++){
          out+=(j<Math.ceil(txt.length*i/frames))?txt[j]:SCR.charAt(Math.floor(Math.random()*SCR.length));
        }
        target.textContent=out;
        i++;
        if(i>frames){clearInterval(iv);target.textContent=txt}
      },40);
    }
    document.querySelectorAll(".nav-links a,.btn:not(.nav-toggle)").forEach(function(el){
      ["mouseenter","focus"].forEach(function(ev){
        el.addEventListener(ev,function(){scramble(el)});
      });
    });
  }

  /* reticle cursor trail */
  if(!reduced&&matchMedia("(pointer:fine)").matches){
    var ret=document.createElement("div");
    ret.className="ret";
    ret.setAttribute("aria-hidden","true");
    document.body.appendChild(ret);
    document.body.classList.add("has-ret");
    var tx=0,ty=0,x=0,y=0,on=false;
    document.addEventListener("pointermove",function(e){tx=e.clientX;ty=e.clientY;on=true});
    (function retRaf(){
      x+=(tx-x)*0.16;
      y+=(ty-y)*0.16;
      ret.style.transform="translate("+x.toFixed(1)+"px,"+y.toFixed(1)+"px)";
      ret.style.opacity=on?(x<3||y<3?"0":".75"):"0";
      requestAnimationFrame(retRaf);
    })();
  }

  /* chapter numerals roll up on reveal */
  if(!reduced){
    document.querySelectorAll(".idx").forEach(function(el){
      var target=parseInt(el.textContent.replace(/[^0-9]/g,""),10)||0;
      var done=false;
      var io3=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting&&!done){
            done=true;
            io3.disconnect();
            if(target>0){
              var cur=0;
              var iv=setInterval(function(){
                cur++;
                el.textContent=(cur<10?"0":"")+cur;
                if(cur>=target){clearInterval(iv)}
              },80);
            }
          }
        });
      },{threshold:.3});
      io3.observe(el);
    });
  }

  /* header dim on scroll */
  var hdr=document.querySelector(".top");
  if(hdr){
    function dimScroll(){
      hdr.classList.toggle("scrolled",(window.scrollY||document.documentElement.scrollTop)>50);
    }
    if(reduced){dimScroll()}
    else{window.addEventListener("scroll",dimScroll,{passive:true});dimScroll()}
  }

  /* section border draw on scroll */
  if("IntersectionObserver" in window){
    var secIO=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add("in-view");
          secIO.unobserve(e.target);
        }
      });
    },{threshold:.08});
    document.querySelectorAll(".section").forEach(function(s){secIO.observe(s)});
  }

  /* smooth anchor offset (accounts for fixed header height) */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click",function(e){
      var id=a.getAttribute("href");
      if(!id||id.length<2)return;
      var target=document.querySelector(id);
      if(!target)return;
      e.preventDefault();
      var top=target.getBoundingClientRect().top+window.pageYOffset-70;
      window.scrollTo({top:top,behavior:reduced?"auto":"smooth"});
    });
  });

  /* line counter roll-up in reports */
  if(!reduced){
    document.querySelectorAll(".lc").forEach(function(el){
      var target=parseInt(el.textContent.replace(/[^0-9]/g,""),10)||0;
      if(target<=0)return;
      var done=false;
      var io4=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting&&!done){
            done=true;
            io4.disconnect();
            var cur=0;
            var iv=setInterval(function(){
              cur++;
              el.textContent=cur;
              if(cur>=target){clearInterval(iv)}
            },60);
          }
        });
      },{threshold:.3});
      io4.observe(el);
    });
  }
})();