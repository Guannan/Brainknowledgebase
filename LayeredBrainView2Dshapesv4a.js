/*LayeredBrainView2Dshapesv4: initialize views and controls from configure json loaded on startup, 
	all controls are generated dynamically 
*/ 
// LayeredBrainView2Dshapesv3: call dynamically load population roivolume data from json files
// LayeredBrainView2Dshapesv2: add tree level variable load shapes at different level
// compatible with the result of wrapGroupAnalysisv3.m and wrapVolumes2xml.m
// LayeredBrainView2Dshapes




var plot1 = null;
var allnew2dViews = [];
var colorxmlhttp = initXmlHttpRequest();
var defaultroifillalpha = 0.7; 
var roifillalpha = defaultroifillalpha;
var mousedown = false;
var currentROI = null;
function SearchObjectbyPropertyValue(propertyname, value)
{
    for (var i=0;i<allnew2dViews.length;i++)
    {
        if ( allnew2dViews[i].config[propertyname] == value )
            return i;
    }
}

// pure js way class create http://www.phpied.com/3-ways-to-define-a-javascript-class/
function LayeredBrainView2Dnew(config){
	this.initialize(config);
};

LayeredBrainView2Dnew.prototype = {
	config: null,
	options: null,
	stage: null,
	currentslicemastervalue: null,
	view: null,
	ImgLayer: null,
	slider: null,
	sliderContainer: null,
	currentcontrast: null,
	currentview: null,
	mousedown: false,
	oldx: 0,
	oldy: 0,
	stagescale: 1,
	initialpositionset: 0,
	RoiColorDom: 0,
	ColorsReady: false,
	ContoursReady: false,
	currentlevel: 0,
	currenttreetype: 1,
	Indexinallnew2dViews: null,
	slidergroupoptions: null,
	sliderconfig: null,
	shapeLayer: null,
	
    initialize: function( arg ) 
	{
		
		this.setup( arg );
		// you have to initialize the images and layers here!!!!!!!!!!!
		// the empty array defined in the prototype is not working!!!!!!! will change as initialize function is called!!!!!!
		this.images = [];
		this.layers = [];
		
        var a = $('#'+this.config.container).css("width");
        this.stage = new Kinetic.Stage({
            container: this.config.container,
            width:  this.config.stagewidth,
            height: this.config.stageheight
        });
        // load colorxml first
        // cannot have local calls of xml request in class definitions!!!!!!!!!
        // the callback of state change will be unable to handle class member variables!!!!!!!!!!!
		$.ajax({
            type: "GET",
            url: configs.general.data_path+"T"+this.currenttreetype+"_roicolors.xml",
            success: function (data) {
                // upon received, update the color in all the views
				ajaxcolorrequestsuccess(data);
            }
        });
		// each slider container may use different configurations to deal with different images,
		// e.g., whole brain , high resolution or brain stem
		this.slidergroupoptions = find_in_array_by_id( this.options.slider_group_options, this.config.slider_group);
//		console.log(this.options);
		this.sliderconfig = find_in_array_by_id( this.slidergroupoptions.sliders, this.config.initial_slider);

        this.slider = new dhtmlxSlider(this.config.sliderContainer,
            {
                size:	this.config.stagewidth - 100,
                skin: "ball",
                vertical:false,
                step:1,
                min:this.sliderconfig.min,
                max: this.sliderconfig.max,
                value: this.sliderconfig.initial
            });
        this.slider.init();
		
		this.currentslicemastervalue = this.slider_value_to_master(this.sliderconfig.initial,this.sliderconfig);
        // don't update view when sliding


        this.slider.AssociatedView = this;
        this.slider.attachEvent("onChange",function(nv)
        {
            this.AssociatedView.currentslicemastervalue = this.AssociatedView.slider_value_to_master(nv,this.AssociatedView.sliderconfig);
			$('#'+this.AssociatedView.slice_selector_id).val(nv);
        });
		
        $('#'+this.config.sliderContainer).mouseup( function(){
            // this in the event function is the div element!!!!!!
            var iobj = SearchObjectbyPropertyValue("sliderContainer", this.id);
            var obj = allnew2dViews[iobj];
//            var obj = SearchObjectbysliderContainerId(this.id);
            obj.updateimages();
        });
        $('#'+this.config.sliderContainer).css({ display: 'inline'});
        $('#'+this.config.container).mousedown(function (e)
            {
                mousedown = true;
                var iobj = SearchObjectbyPropertyValue("container", this.id);
                var obj = allnew2dViews[iobj];
                obj.mousedown = true;
                obj.oldx=e.pageX;
                obj.oldy=e.pageY;

            });
        $('#'+this.config.container).mouseup(function ()
        {
            mousedown = false;
            var iobj = SearchObjectbyPropertyValue("container", this.id);
            var obj = allnew2dViews[iobj];
            obj.mousedown = false;
        });

        $('#'+this.config.container).mousemove(function (e)
        {
            var iobj = SearchObjectbyPropertyValue("container", this.id);
            var obj = allnew2dViews[iobj];
            var pos = obj.stage.getPosition();
//            $("#panmouse").html(String(pos.x)+", "+String(pos.y));
//            $("#panmouse").html("aaaaaaaaaa");
//            $("#panmouse").html(String(e.pageX)+", "+String(e.pageY));
            if (obj.mousedown)
            { 
                var x=e.pageX;
                var y=e.pageY;
                if (obj.oldx == 0) { obj.oldx = x; }
                else if (obj.oldy == 0) { obj.oldy = y; }
                else
                {
                    var dx = x - obj.oldx;
                    var dy = y - obj.oldy;
                    obj.stage.setPosition(pos.x+dx, pos.y+dy);
                    obj.oldx = x;
                    obj.oldy = y;
                }
                obj.stage.draw();
            }
        });


/*        var slideshow = document.getElementById(this.container);
        var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x
        if (slideshow.attachEvent) //if IE (and Opera depending on user setting)
            slideshow.attachEvent("on"+mousewheelevt, changeimage);
        else if (slideshow.addEventListener) //WC3 browsers
            slideshow.addEventListener(mousewheelevt, changeimage, false);
  */
		
		var tview = find_in_array_by_id( this.options.view_layout_options, this.config.view_layout);
		this.config.view_layout = tview;
		var tlayers = tview.layers;
		
		for (var i in tlayers)
		{
			this.addlayer(find_in_array_by_id( this.options.layer_options, tlayers[i]), i);
		}
		
		this.updateimages();     //updateimages must be before adding layers to stage!!!!!!
		
		
		for (var i = 0; i < this.layers.length; i ++)
		{
			this.stage.add(this.layers[i]);
			var t = this.layers[i].getCanvas();
			// t._canvas.id = 'ttt';
			// the added layers are not immediately avaialbe after calling the function!!!
			// this.stage.children[i].children[0].attrs.image.onload is still undefined.
			// it takes a while to add all the members!!!!!!
			// so it's possible that onload function of the Image object is not avaiable when
			// the image is ready!!!!!!!!!
			// todo: have to work to make sure all layers are added to stage before 
			// updating images!!!!!!!
//			console.log(this.stage.children[i].children[0].attrs.image.onload);
		}
//		console.log(this.stage.children[0].children[0].attrs.image.onload);
		
		this.updateimages();     //updateimages must be before adding layers to stage!!!!!!
		
//		console.log("allnew2d: "+allnew2dViews[0].shapeLayer);
    },
	setup: function ( config ){
	
		// a way that only modifies the property values specified in config, and keep others default.
		for (var key in config) {
		  if (config.hasOwnProperty(key)) 
		  {
				this[key] = config[key];
		  }
		}
		this.Indexinallnew2dViews = allnew2dViews.length;
		allnew2dViews.push(this);
		
	},
	
	addlayer: function( layerconfig, i)
	{
		
		this.layers[i] = new Kinetic.Layer({        throttle: 1000       });
		this.images[i] = new Image();
		this.layers[i].layerconfig = layerconfig;
		this.layers[i].image_type = layerconfig.image_type;
		this.layers[i].display_name = layerconfig.title;
		var layoutgroup = find_in_array_by_id( this.options.image_layout_group_options, this.config.image_layout_group);
		var layout = find_in_array_by_id( layoutgroup.layouts, layerconfig.image_layout);
		// save the layout configuration with layer
		this.layers[i].image_layout_config = layout;
		// bound slider configuration to each layer, b/c when calling updateimage, 
		// the image number should be calculated from per-layer slider configuration, 
		// 
		if ( layerconfig.use_slider )
		{
			this.layers[i].slider_config = find_in_array_by_id(this.slidergroupoptions.sliders, layerconfig.slider_id);
		}
		
		switch ( layerconfig.image_type )
		{
			// http://stackoverflow.com/questions/13104494/does-javascript-pass-by-reference

			case 'hidden':
				var t = this.layers[i].getCanvas();
				t._canvas.id = this.config.id+'_hidden_image_canvas_'+this.config.view_layout.layers[i];				

			case 'dense':
				var t = this.layers[i].getCanvas();
				t._canvas.id = this.config.id+'_dense_image_canvas_'+this.config.view_layout.layers[i];
			
			case 'grid':
				this.images[i].layer = this.layers[i];
				this.images[i].view = this;
				this.images[i].firsttimeloading = true;
				// save the layout configuration for positioning purpose
				
				this.images[i].onload = function(){
					// force reset position when every layer loaded first time
//					console.log("addlayer on load: "+this.src+" complete? "+this.complete);
					resetpositionfirsttimeloading(this);
					this.firsttimeloading = false;
	//            var a = 0;
				   this.layer.draw();
					switch ( this.image_type )
					{
						case 'hidden':
							this.layer.show();
							save_original(this.view.slice_selector_id);
							break;
					}
				   
//		           this.layer.getStage().draw();
					//            this.parent.draw();
				};
				var Kimage = new Kinetic.Image({
					image: this.images[i],
					alpha: 1,
					opacity: 1
				});
				Kimage.setPosition(layout.position[0], layout.position[1]);
				Kimage.setScale(layout.aspect_ratio_x, layout.aspect_ratio_y);
//				Kimage.setScale(1, 2);
				this.layers[i].add(Kimage);
				this.images[i].onerror = function()
				{
					console.log("error on load: "+this.src);
				};
				this.images[i].image_type = layerconfig.image_type;
				break;
			case 'contour':
//				console.log(this.layers.length);
				this.shapeLayer = this.layers.length - 1;
				this.
				break;
		}
		
	},
	updateimages: function()
	{
		for (var i = 0;i < this.layers.length;i++)
		{
//			console.log(i);
			var config = this.layers[i].layerconfig;
			switch (config.image_type)
			{
				case 'hidden':
					this.images[i].src = config.image_path 
						+ config.image_prefix + "_" 
						+ this.config.image_midfix + "_" 
						+ zeroFill( this.master_to_slider_value(this.layers[i].slider_config), 3 )
						+ config.image_suffix;
						+ config.image_suffix + "?" + new Date().getTime();
					break;
				case 'dense':
//					this.linkprefix+this.currentcontrast.filename+"_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".jpg";
					this.images[i].src = config.image_path 
						+ config.image_prefix + "_" 
						+ this.config.image_midfix + "_" 
						+ zeroFill( this.master_to_slider_value(this.layers[i].slider_config), 3 )
						+ config.image_suffix;
						// force reload? http://stackoverflow.com/questions/16822831/what-is-the-best-way-to-force-an-image-refresh-on-a-webpage
						+ config.image_suffix + "?" + new Date().getTime();
//					console.log(this.images[i].src);
					break;
				case 'contour':
//					var xmlfn = this.linkprefix+"roicontours_"+this.currentview.roifilename+"_"+ zeroFill( this.currentslice, 3 ) + "_T" + this.currenttreetype + "_L" + this.currentlevel + ".xml";
					// delete the old ones before updating, 
					// the contours are removed only when stage.draw() is called,
					// however if it's called here, there will be blinking before a new contour is loaded
					// so move the draw() method in the complete handler of ajax request of the contour
					this.layers[i].destroyChildren();  // no destroyChildren function in version 3.9.7 must write it yourself!!!!
					
					var xmlfn = config.image_path 
						+ config.image_prefix + "_" 
						+ this.config.image_midfix + "_" 
						+ zeroFill( this.master_to_slider_value(this.layers[i].slider_config), 3 )
						+ "_T" + this.currenttreetype + "_L" + this.currentlevel  
						+ config.image_suffix;					
					$.ajax({
						type: "GET",
						url: xmlfn,
						success: function (data) {
							for (var i=0;i < allnew2dViews.length;i++)
							{
								allnew2dViews[i].updateroicontoursfromxml(data);
							}
						},
						// http://api.jquery.com/jquery.ajax/ 
						// complete callback option fires, when the request finishes, whether in failure or success.
						complete:function (data) {
							for (var i=0;i < allnew2dViews.length;i++)
							{
								// call the draw() here to prevent blinking during updating contours
								allnew2dViews[i].stage.draw();
							}
						} 
					});
					break;
				case 'grid':
					this.images[i].src = config.image_path 
						+ config.image_prefix + "_" 
						+ this.config.image_midfix
						+ config.image_suffix;				
//						console.log(this.images[i].src);
					break;
				default:
					console.log('unknown image type: '+config.image_type);
			}
		}
	},
    BSslice2slice: function (nv)
    {
        switch ( this.view )
        {
            case 'axial':
                this.currentslice = Math.round( ( nv+55)/ 5);
                break;
            case 'sagittal':
                this.currentslice = Math.round(( nv - 215)/5) + 181;
                break;
            case 'coronal':
                this.currentslice = Math.round( nv / 5) + 202;
                break;
        }

    },
    updateimage:    function ()
    {
//        Imageobject.src = slices[currentslice-1].getAttribute("filename");
//        ImageObject.src = "imgs/"+"t1_axi_"+ currentslice +".png" ;
//        this.ImageObject.src = "Figures/"+this.currentcontrast.foldername+"/"+this.currentcontrast.foldername+"_"+this.currentview.foldername+"_bmp/"+this.currentcontrast.filename+"_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".jpg";
//        this.ImageObject.src = "../roivis/jobid="+this.jobid+"filename="+this.currentcontrast.filename+"_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".jpg";
        this.ImageObject.src = this.linkprefix+this.currentcontrast.filename+"_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".jpg";
//        $("#mouse").html(this.ImageObject.src);
//        ROISenseObject.src = "imgs/"+"roi_axi_"+ currentslice +".png" ;
//        this.ROISenseObject.src = "Figures/"+this.currentcontrast.foldername+"/"+this.currentcontrast.foldername+"_"+this.currentview.foldername+"_bmp/"+this.currentcontrast.filename+"_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".jpg";
//        this.ROISenseObject.src = "Figures/AndreiaROIs/"+"roi_"+this.currentview.roifilename+"_"+ zeroFill( this.currentslice, 3 ) +".png" ;
//        this.ROISenseObject.src = "../roivis/jobid="+this.jobid+"filename="+"roi_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".png";
        this.ROISenseObject.src = this.linkprefix+"roi_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".png";
//        this.ROIOutlineObject.src = "Figures/BPM_TypeI_V2.0/BPM_TypeI_V2.0_"+ this.currentview.foldername+"/"+"bpm_typeI_v2.0_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +"backgroundalpha0.png" ;
//        this.ROIOutlineObject.src = "../roivis/jobid="+this.jobid+"filename="+"outlines_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".png";

//        this.ROIOutlineObject.src = this.linkprefix()+"outlines_"+this.currentview.filename+"_"+ zeroFill( this.currentslice, 3 ) +".png";

//        document.getElementById("txtHint").innerHTML= "Figures/BPM_TypeI_V2.0/BPM_TypeI_V2.0_"+currentview.foldername+"/"+"bpm_typeI_v2.0_"+currentview.filename+"_"+ zeroFill( currentslice, 3 ) +"backgroundalpha0.png" ;

//        this.BSImageObject.src = "Figures/BrainStem/"+this.currentBScontrast.name+"_"+this.currentview.BSfilename+"_"+zeroFill( this.currentBSslice, 3 )+".png";

//        this.ROISenseHiderObject.src = "Figures/roihider_"+this.currentview.roifilename+".png";

//        var xmlfn = "XinAtlasRoisurfacesYue/roicontours_"+this.currentview.roifilename+"_"+ zeroFill( this.currentslice, 3 ) + ".xml"
        var xmlfn = this.linkprefix+"roicontours_"+this.currentview.roifilename+"_"+ zeroFill( this.currentslice, 3 ) + "_T" + this.currenttreetype + "_L" + this.currentlevel + ".xml";
		$.ajax({
            type: "GET",
            url: xmlfn,
            success: function (data) {
				for (var i=0;i < allnew2dViews.length;i++)
				{
					allnew2dViews[i].updateroicontoursfromxml(data);
				}
				 //Do stuff
            }
        });

//        $("#mouse").html(this.ROISenseObject.src);
            // you can't draw the image immediately after changing its src, you still have the old image
            // you can only draw when the image is loaded, draw in the onload() function of the image object.
//      document.getElementById("txtHint").innerHTML=slices[currentslice-1].getAttribute("filename");
    },

    calculatecenterpointposition: function(stagescale)
    // get the point coordinate of stage at the center of the view
    {
        var size = this.stage.getSize();
        var centerpointinstage =  {y:0, x:0};
        centerpointinstage.y = (this.stage.getSize().height/2 - this.stage.getPosition().y)/stagescale;
        centerpointinstage.x = (this.stage.getSize().width/2 - this.stage.getPosition().x)/stagescale;
        return centerpointinstage;
    },
    calculatepositionofstage: function(centerpointinstage, stagescale)
    // calculate the position of stage such that the center of view doesn't move under new scale
    {
        var pos={x:0,y:0};
        pos.x = this.stage.getSize().width/2 - centerpointinstage.x * stagescale;
        pos.y = this.stage.getSize().height/2 - centerpointinstage.y * stagescale;
        return pos;
    },
    
    zoomin: function()
    {
        var centerpointinstage = this.calculatecenterpointposition(this.stagescale);
        this.stagescale = this.stagescale*1.5;
        this.stage.setScale(this.stagescale, this.stagescale);
        var pos = this.calculatepositionofstage(centerpointinstage, this.stagescale);
        this.stage.setPosition(pos.x, pos.y);

        this.stage.draw();
//		save_original()
//		reset_canvas(axi_filter.element_id);		
//		reset_canvas(cor_filter.element_id);		
//		reset_canvas(sag_filter.element_id);		
//		update_filter_setting(scale_factor,filter_name,axi_filter.element_id);
		axi_filter.update_brightness();
		axi_filter.update_contrast();
		cor_filter.update_brightness();
		cor_filter.update_contrast();
		sag_filter.update_brightness();
		sag_filter.update_contrast();
    },

    zoomout: function()
    {
        var centerpointinstage = this.calculatecenterpointposition(this.stagescale);
        this.stagescale = this.stagescale*0.75;
        this.stage.setScale(this.stagescale, this.stagescale);
        var pos = this.calculatepositionofstage(centerpointinstage, this.stagescale);
        this.stage.setPosition(pos.x, pos.y);
        
        this.stage.draw();
/*		save_original()
		reset_canvas(axi_filter.element_id);		
		reset_canvas(cor_filter.element_id);			
		reset_canvas(sag_filter.element_id);			*/
		axi_filter.update_brightness();
		axi_filter.update_contrast();
		cor_filter.update_brightness();
		cor_filter.update_contrast();
		sag_filter.update_brightness();
		sag_filter.update_contrast();		
    },
    resetposition: function()
    {
        this.stagescale = 1;
        this.stage.setScale(1, 1);
        // triger initial position calculation
        this.initialpositionset = 0;
        this.setinitialposition();
    //        stage.setPosition(0, 0);
        this.stage.draw();
    },
    setinitialposition: function()
    {
	// will position the first image layer in the center of stage
        if (this.initialpositionset == 0)
        {
            var centerpointinstage = {y:this.images[0].naturalHeight * this.layers[0].image_layout_config.aspect_ratio_y /2, x:this.images[0].naturalWidth * this.layers[0].image_layout_config.aspect_ratio_x /2 };
            var pos = this.calculatepositionofstage(centerpointinstage, this.stagescale);
            this.stage.setPosition(pos.x, pos.y);
            this.initialpositionset = 1;
        }
    },
/*    drawROI: function(MouseDownROI)
    {

        var node = $("#tree").dynatree("getTree").getNodeByKey(String(MouseDownROI));
        var sensecanvas = this.ROISenseLayer.getCanvas();
        var ctx = this.ROIDrawLayer.getCanvas().getContext("2d");
        ctx.clearRect ( 1 , 1 , sensecanvas.width , sensecanvas.height );
        switch (this.currentcontrast.name)
        {
            case "T1":
                ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
                break;
            case "color":
                ctx.fillStyle = "rgba(256, 256, 256, 0.5)";
                break;
        }

        // sense all the points at once to speed up
        var sensedROI = this.ROISenseLayer.getCanvas().getContext("2d").getImageData(1, 1, sensecanvas.width, sensecanvas.height);
        // draw only when mouse clicks in the brain
        if (MouseDownROI != 0)
        {
            for (var x=0;x<sensecanvas.width;x++)
            {
                for (var y=0;y<sensecanvas.height;y++)
                {
                    // image data is linearly saved array, one pixel occupies four elements[r,g,b,a];
    //                    if (sensedROI.data[( x + y * sensecanvas.width) * 4] == MouseDownROI)
                    // the in operator in js is the find the index not the value!!!!!! can't use index here!!!!!!
    //                    if (sensedROI.data[( x + y * sensecanvas.width) * 4] in node.data.labels)
                    // to find if a value is in an array
    //                    if ($.inArray(sensedROI.data[( x + y * sensecanvas.width) * 4], node.data.labels) >= 0)
                    // array index of is faster
                    if (node.data.labels.indexOf(sensedROI.data[( x + y * sensecanvas.width) * 4]) >= 0)
                    {
                        // todo: kinetic 4.7.2 doesn't support fillRect function
//                        ctx.fillRect(x,y,1,1);
                    }
                }
            }
        }
    },
*/	
	master_to_slider_value: function(sliderconfig)
	{
		var coeff = sliderconfig.linear_coeff_convert_from_master;
		var cvalue = Math.min( Math.max( Math.round(this.currentslicemastervalue * coeff [0] + coeff[1]), sliderconfig.min ), sliderconfig.max);
		return cvalue;
	},
	slider_value_to_master: function(nv, sliderconfig)
	{
		var coeff = sliderconfig.linear_coeff_convert_to_master;
		var cvalue = nv * coeff [0] + coeff[1];
		return cvalue;
	},

    setroicolorsfromxml: function( fillalpha ){
//        var x=this.RoiColorDom.getElementsByTagName("S-24-1");
        // general_random tag is for the randomly generated roi colors not the zscore-encoded colors
        var x=this.RoiColorDom.getElementsByTagName("general_random");
    //
        for (var i = 0; i <  x[0].children.length; i ++)
        {
            var tn = x[0].children[i].tagName;
            var subshape = this.layers[this.shapeLayer].get("#"+this.config.image_midfix+"_"+tn);
    //                    var xc=x[0].getElementsByTagName();
    //                    subshape.setFill(x[0].children[i].innerHTML);
            if (subshape.length != 0)
            {
                // chrome doesn't have .innerHTML!!!!!
				
//                subshape[0].setFill('rgba(0,255,0,0.5)');
				// this version of kinetic doesn't have fillalpha attribute, must use rgba to set alpha
				
				var rgb = Kinetic.Util._hexToRgb(x[0].children[i].textContent);
                subshape[0].setFill('rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', '+fillalpha+')');
				subshape[0].setStroke('rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', 255)');
//                subshape[0].setFill(x[0].children[i].textContent);
//				subshape[0].attrs.fillAlpha =  fillalpha ;
            }
    //                    xc.innerHTML = 1;
        }
        this.layers[this.shapeLayer].draw();
    },
	updateslider: function(layerindx)
	{
		var tlayer = find_in_array_by_id(this.options.layer_options, this.config.view_layout.layers[layerindx]);
		this.sliderconfig = find_in_array_by_id( this.slidergroupoptions.sliders, tlayer.slider_id);
		this.slider.setMax(this.sliderconfig.max);
		this.slider.setMin(this.sliderconfig.min);
		var slider_value = this.master_to_slider_value(this.sliderconfig);
		this.slider.setValue(slider_value);
		$('#'+this.slice_selector_id)
		.val(slider_value)
		.attr("max",this.sliderconfig.max)
		.attr("min",this.sliderconfig.min);
	},
    updateroicontoursfromxml: function(xmldom)
	{
        var x=xmldom.getElementsByTagName("orientation");
        // only update when orientation matches current view
        if ( x[0].textContent == this.config.image_midfix )
        {
            this.layers[this.shapeLayer].destroyChildren();  // no destroyChildren function in version 3.9.7 must write it yourself!!!!
//            var children = this.shapesLayer.children;
//            while(children.length > 0) {
//                Kinetic._removeId(children[0]._id);
//                Kinetic._removeName(children[0].getName(), children[0]._id);
//                children[0].remove();

//                children[0].destroy();
//            }
            var paths = xmldom.getElementsByTagName("contourpath");
            paths = paths[0];
//            for (var i = 0; i <  paths.children.length - 1; i ++)
            for (var i = 0; i <  paths.children.length; i ++)
            {
                var tn = paths.children[i].tagName;
                var path = paths.children[i].textContent;
                var shape = new Kinetic.Path({
//                    points: points,
                    fillrule: 'evenodd',
                    commands: path,
                    data: path,
//                    data: 'M 100 100 L 200 100 L 200 200 L 100 200 z',
//                    data: 'M 0 0 L 100 0 L 100 100 L 0 100 z',
                    fill: '#00f',
                    // the id should be globally unique, different views can't use the same ids
                    id: this.config.image_midfix+'_'+tn,
					// set the scale (aspect ratio) of contours
					scale: [
								this.layers[this.shapeLayer].image_layout_config.aspect_ratio_x,
								this.layers[this.shapeLayer].image_layout_config.aspect_ratio_y
							],
                    stroke: '#fff',
                    strokeWidth: 1,
                    opacity: defaultroifillalpha
                });
                // v3a: the paths in the shape layer will take care of all the mouse interaction.
                shape.on("mouseup",function(e) {
                        var key = this.attrs.id.match(/[0-9]+/g);
//                        $("#panmouse").html("roi key: "+key);
                    // don't need to lookup, the contour is the current roi at correct level!!!!!!
//                        var currentROI = findroiatlevel( parseInt(key[0]), allnew2dViews[0].currentlevel);
                        currentROI = key[0];
                        var MouseDownROI = parseInt(key[0]);
                    // todo: drawROI doesn't work in Kinetic 4.7.2
    //            this.view.drawROI(MouseDownROI);

                    if ( MouseDownROI != 0)
                    {
                        // first unexpand the tree
                        $("#tree").dynatree("getRoot").visit(function(node){
                            node.expand(false);
                        });
                        // then, expand the activated item by the key=currentroi
                        // the key property of a node is for searching the node in a tree.
                        $("#tree").dynatree("getTree").activateKey(String(currentROI));
                    }
    //            if ( $.inArray(currentROI, rois) > 0) //  rois is not an array, it's an object!
                    // should use if('key' in myObj)
                    if(currentROI in rois)
                    {
                        var croi = rois[currentROI];
    //                popmenu(e, croi);
                        var node = $("#tree").dynatree("getTree").getNodeByKey(String(currentROI));

                        popmenu(e, croi, getidname(node.data.idname,treetype));

                    }

                    });

                shape.on("mousemove",function(e) {
                    var previousROI = currentROI;
                    var key = this.attrs.id.match(/[0-9]+/g);
                    currentROI = key[0];
                    if (!mousedown)
                    {
                        if(currentROI in rois)
                        {
                            var croi = rois[currentROI];
                            Roitipmenu(e, croi.shortname);
                        }
                        else
                        {
                            Roitipmenu(e, '0');
                        }
                    }
                    if (( previousROI != currentROI)||(mousedown))
                    {
                        $("#contextMenu").css({
                            display: 'none'
                        });
                    }


                });
                shape.on("mouseout", function (e) {
                    $("#ROItip").css({
                        display: 'none'
                    });
                });

                this.layers[this.shapeLayer].add(shape);
            }
//            this.setinitialposition();
//            this.layers[this.shapeLayer].draw();
            this.ContoursReady = true;
            // color must be rendered when both shapes and colors are loaded
            if (this.ColorsReady)
            {
                this.setroicolorsfromxml( roifillalpha );
            }
			this.stage.draw();
        }
    }





}

function initXmlHttpRequest()
{
    var xmlhttp;
    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    return xmlhttp;
}
function Roitipmenu(e, croiname)
{

    $("#ROItip").css({
        display: 'inline',
        position: 'absolute',
        color: '#FFFFFF',
        background: '#000000',
        fontFamily: "Calibri",
        fontSize: 20,
        top:e.pageY+3,
        left: e.pageX+3,
        opacity: 1
    });

    //build links

    $("#ROItip").html(croiname); //clear
}

function popmenu(e, croi, idname)
{

    $("#contextMenu").css({
        display: 'inline',
        position: 'absolute',
        top:e.pageY+3,
        left: e.pageX+3,
        opacity: 1
    });

    //build links
    // makes some lists
    // must use paired tags of br in xhtml page!!!!!!!
    $("#contextMenuB").html(croi.fullname+'<br></br>'); //clear
    $('<ul></ul>').attr({id: 'cascadelists'})
        .appendTo($("#contextMenuB"));
    $('<li>External Links</li>').attr({id: 'cascadelist1'})
        .appendTo($("#cascadelists"));
    $('<ul></ul>').attr({id: 'cascadelist1s'})
        .appendTo($("#cascadelist1"));
    $('<li></li>').attr({id: 'cascadelist1s1'})
        .appendTo($("#cascadelist1s"));
    $('<a target="_blank"></a>')
        .attr({href: 'http://www.ncbi.nlm.nih.gov/pubmed?term='+croi.fullname})
        .html('PubMed<br></br>').appendTo($("#cascadelist1s1"));
    $('<li></li>').attr({id: 'cascadelist1s2'})
        .appendTo($("#cascadelist1s"));
    $('<a target="_blank"></a>')
        .attr({href: 'https://www.google.com/#hl=en&q='+croi.fullname})
        .html('Google<br></br>').appendTo($("#cascadelist1s2"));
    $('<li></li>').attr({id: 'cascadelist1s3'})
        .appendTo($("#cascadelist1s"));
    $('<a target="_blank"></a>')
        .attr({href: 'http://en.wikipedia.org/wiki/'+croi.fullname})
        .html('Wikipedia').appendTo($("#cascadelist1s3"));

    $('<li>Internal Links</li>').attr({id: 'cascadelist2'})
        .appendTo($("#cascadelists"));
    $('<ul></ul>').attr({id: 'cascadelist2s'})
        .appendTo($("#cascadelist2"));
    $('<li></li>').attr({id: 'cascadelist2s1'})
        .appendTo($("#cascadelist2s"));
    $('<a target="_blank"></a>')
        .attr({href: ''})
        .html('Description<br></br>').appendTo($("#cascadelist2s1"))
    $('<li></li>').attr({id: 'cascadelist2s2'})
        .html('Pathology Cases')
        .appendTo($("#cascadelist2s"));
/*    $('<li></li>').attr({id: 'cascadelist2s3'})
        .html('volume plot')
        .appendTo($("#cascadelist2s"));
*/
    $('<li></li>').attr({id: 'cascadelist2s4'})
//        .attr('data-toggle', 'modal').attr('data-target', 'VolumePlot')
        .html('percentage plot')
        .appendTo($("#cascadelist2s"))
        .click(function() {
            /* http://api.jquery.com/jquery.getjson/
             when debugging from a static local webpage, have to use cross domain for debugging when want to get json from another domain
             http://james.padolsey.com/javascript/cross-domain-requests-with-jquery/
             <script src="jquery.xdomainajax.js" type="text/javascript"></script>
             // you have to use http instead of https for debuggin, https could cause ERR_INSECURE_RESPONSE error
             */
            // cross domain request, for local development and debugging use
//            var jsonname = "http://braingps.anatomyworkslocal.com/roivolumes%3Froiname="+croi.shortname+"treetype="+treetype;
            // check the address of dynamic page is /roivis but the query link is at a higher level
            // local request for deployed code
//            var jsonname = "../roivolumes%3Froiname="+croi.shortname+"treetype="+treetype;
//            var jsonname = "../roivolumes%3Froiidname="+idname;
            var jsonname = configs.general.control_roi_volume_json_prefix+"/roivolumes%3Froiidname="+idname;

            console.log(jsonname);
            /*
             $.ajax({ // another way to make a json request
             dataType: "json",
             type: 'GET',
             url: jsonname,
             success: function( data ) {
             plotROIvolumesfromJsonData( data );
             //                console.log( "success" );
             }
             });*/
            // empty plot container, then plot new data
            $('#VolumePlot').empty().height(300).width(500);
            // we want to plot both subject data and population data in one plot, but not simultanously.
            // we use global variable plot1 to hold the subject( first) plot data
            // from json.
            // the strategy here is to first pre-allocate the data points for the population volume data,
            // it's why drawing two points in the plotSubjectROIvolumes function,
            // when the json is loaded, replace one of the data to the data from json. clear the plot and replot with
            // subject and population data.
            // plotSubjectROIvolumes
            var point = [];
			if (subjectdemography != null)
			{
				point.push( [subjectdemography.age, croi.percentvolume] );
				plotSubjectROIvolumes( 'VolumePlot', point );
			}
            $.getJSON( jsonname, function( data ) {
                plotROIvolumesfromJsonData( data, {xlabel: 'age',ylabel:'percent volume'});
//                console.log( "success" );
            });

//            plotROIvolumes( croi.shortname, 'volume' );
        });
/*        .click(function() {
            plotROIvolumes( croi.shortname, 'percentage' );
        });
*/
/*    $('<li></li>').attr({id: 'cascadelist2s5'})
        .html('zscore plot')
        .appendTo($("#cascadelist2s"))
        .click(function() {
            plotROIvolumes( croi.shortname, 'zscore' );
        });
*/
/**/    $('<li></li>').attr({id: 'VolumePlot'})
        .appendTo($("#cascadelist2s"));

    $('<ul></ul>').attr({id: 'cascadelist2s2s'})
        .appendTo($("#cascadelist2s2"));
    $('<li></li>').attr({id: 'cascadelist2s2s1'})
        .appendTo($("#cascadelist2s2s"));
    $('<a target="_blank"></a>')
        .attr({href: ''})
        .html('JHU MRI inventory').appendTo($("#cascadelist2s2s1"));
    $('<li></li>').attr({id: 'cascadelist2s2s2'})
        .appendTo($("#cascadelist2s2s"));
    $('<a target="_blank"></a>')
        .attr({href: ''})
        .html('JHU Pathology Inventory').appendTo($("#cascadelist2s2s2"));

    /*        $('<a target="_blank"></a>')
     .attr({href: 'http://www.ncbi.nlm.nih.gov/pubmed?term='+croi.fullname})
     .html('PubMed</br>').appendTo($("#contextMenuB"));

     $('<a target="_blank"></a>')
     .attr({'href': 'https://www.google.com/#hl=en&q='+croi.fullname})
     .html('Google</br>').appendTo($("#contextMenuB"));
     $('<a target="_blank"></a>')
     .attr({'href': 'http://en.wikipedia.org/wiki/'+croi.fullname})
     .html('Wikipedia').appendTo($("#contextMenuB"));
     */
}

// only update view when mouse is up
/*
function drawROI(MouseDownROI)
{
    // in xhtml: use &lt for less than
    for (var i=0;i < allnew2dViews.length;i++)
    {
        allnew2dViews[i].drawROI(MouseDownROI);
    }
}
*/
function findroiatlevel(roi,level)
{
    // default 0;
    var labelatlevel = 0;
    if (roi!=0)
    {
        labelatlevel = rois[roi].labelsatlevels[level];
    }
    return labelatlevel;
}
function plotROIvolumesfromJsonData( data, plotoption )
{
    var points = [];
    var age;
    var subjectID;
    var volume;
//    var ele = roivolumesDom.getElementsByTagName(roiname);
    var roiname;
    roiname = data.response[0].ROIVolumes[0].roiname;
/*    switch (treetype)
    {

        case 1:
            roiname = data.response[0].ROIVolumes.TreeTypeI[0].roiname;
            break;
        case 2:
            roiname = data.response[0].ROIVolumes.TreeTypeII[0].roiname;
            break;
    }
*/
    for (var i = 0; i <  data.response.length; i ++)
    {
        age = data.response[i].Age;
        subjectID = data.response[i].SubjectID;
        volume = data.response[i].ROIVolumes[0].percenvolume;
/*        switch (treetype)
        {
            case 1:
                volume = data.response[i].ROIVolumes.TreeTypeI[0].volume;
                break;
            case 2:
                volume = data.response[i].ROIVolumes.TreeTypeII[0].volume;
                break;
        }
*/
//        volume = data.response[i].ROIVolumes.TreeTypeI[0].volume;
        // the first two elements are for drawing the points, the third subjectID is for loading images representing the point
        points.push([age, volume, subjectID]);
    }
    var plotparas = {
        points: points,
        title: roiname,
        xlabel: plotoption.xlabel,
        ylabel: plotoption.ylabel
    };
    PlotVolumeData('VolumePlot',plotparas);
//    console.log( "json request success" );
}
function plotSubjectROIvolumes(containerid, point )
{
    // the strategy here is to first pre-allocate the data points for the population volume data
    // it's why putting two point in the data,
    // when the json is loaded later, replace one of the data to the data from json.

    plot1 = $.jqplot (containerid, [point, point],{
        // must use series to specify properties of lines, even when only one line to draw!!!!!!
        series:[
            {
                showLine:false,
                markerOptions: { color: '#ff0000', size: 17, style:"x" }
            },
            {
                showLine:false,
                markerOptions: { color: '#ff0000', size: 17, style:"x" }
            }
        ],
        // highlight when mouse hovering on the point
        // to enable highlighting data points must add the plugin like this:
        // <script class="include" type="text/javascript" src="jquery.jqplot.1.0.8r1250/dist/plugins/jqplot.highlighter.js"></script>
        highlighter: {
            show: true,
            sizeAdjust: 7.5
//            tooltipFormatString: '%f, %f, %s',
            // customize the tooptip string: http://www.jqplot.com/docs/files/plugins/jqplot-highlighter-js.html#$.jqplot.Highlighter.formatString
        },
        cursor: {
            show: false
        }
    });

}

function getidname(idname,treetype)
{
    // arbitrator for new/old version of idname, old version has format Lx_xxxx, new version has format Tx_Lx_xxxx
    var n = idname.search(/\bT/);
    if (n==0)
    {
        return idname;
    }else
    {
        idname = "T"+treetype+"_"+idname;
        return idname;
    }



}
function PlotVolumeData(containerid,plotparas)
{
    // must have bracket to plot point pairs!!!!!!!!!
    // empty the container first everytime
    // now we want to plot multiple data
/*    $('#'+containerid).empty()
        .height(300)
        .width(500);
*/
    /*       if (plot1 !== null)
     {
     plot1.replot( { resetAxes:true } );
     }
     */

//    plot1.series[1].data = plotparas.points;
    $('#'+containerid).empty().height(300).width(500);
    var seriesdata = [ plot1.series[0].data, plotparas.points ];
/*    plot1.drawSeries({},1);

    plot1.reInitialize();
    plot1.init(
        'VolumePlot',
        [seriesdata[0], seriesdata[1]],
        {
            title:plotparas.title,
            series:[
                {
                    showLine:false,
                    markerOptions: { color: '#ff0000', size: 7, style:"x" }
                },
                {
                    showLine:false,
                    markerOptions: { color: '#00ff00', size: 7 }
                }
            ],
            axes:{
                xaxis:{
                    label:plotparas.xlabel
                },
                yaxis:{
                    label:plotparas.ylabel
                }
            },
            highlighter: {
                show: true,
                sizeAdjust: 7.5,
//            tooltipFormatString: '%f, %f, %s',
                // customize the tooptip string: http://www.jqplot.com/docs/files/plugins/jqplot-highlighter-js.html#$.jqplot.Highlighter.formatString
                formatString:'<table class="jqplot-highlighter">'+
                    '<tr><td>Age:</td><td>%d</td></tr>'+
                    '<tr><td>volume:</td><td>%.3f</td></tr>'
            }
        }
    );*/
    $('#'+containerid).bind('jqplotDataClick',
        function (ev, seriesIndex, pointIndex, data) {
//            $('#mouse').html('series: '+seriesIndex+', point: '+pointIndex+', data: '+data[0]+", "+data[1]+"subjectID: "+data[2]);
            // open new
//            window.open("viewresult%3Fjobid=119");
//            window.open("viewcontrolsubject%3Fsubjectid="+data[2]);
			// the link of control data need to require no log in to visit 
			// the route roivis.viewcontrolsubject
            window.open(configs.general.control_data_link_prefix+"/viewcontrolsubject%3Fsubjectid="+data[2]);
            $('#mouse').html('point: '+pointIndex+', data: '+data[0]+", "+data[1]+" subjectID: "+data[2]);
        }
    );
//    plot1.replot();
//    plot1.resetAxesScale(true);


    // the order: the current subject seriesdata[0] plotted last, not to be hiden by population data points
    plot1 = $.jqplot (containerid,[seriesdata[1], seriesdata[0]],{
        // you can speicify datarenderer, but here we are using default line renderer,
        // and draw the data using the first two numbers in the data points
//        animateReplot: true,
        title: plotparas.title,
        // Don't sort data when plotting scattered data, not not plotting single valued function line, can't sort data, otherwise will be error when picking up data points!!!!!!!!!!!
        // it's a bug in jqplot !!!!!!!! when there are data points with same x values, the order of points after sorting will change and checkIntersection can't return correct value!!!!!!
        // must set sortData: false !!!!!!
        sortData: false,
        // specify properties of each series
        // must use series to specify properties of lines, even when only one line to draw!!!!!!
            series:[
            {
                showLine:false,
                markerOptions: { color: '#00ff00', size: 7 }
            },
            {
                showLine:false,
                markerOptions: { color: '#ff0000', size: 7, style:"x" }
            }
        ],
        axes:{
            xaxis:{
                label:plotparas.xlabel
            },
            yaxis:{
                label:plotparas.ylabel
            }
        },
        // highlight when mouse hovering on the point
        // to enable highlighting data points must add the plugin like this:
        // <script class="include" type="text/javascript" src="jquery.jqplot.1.0.8r1250/dist/plugins/jqplot.highlighter.js"></script>
    highlighter: {
        // if useAxesFormatters: true, the data point values will be rounded to the grid values, so don't use it, use your own formmat to show the data!!!!
            useAxesFormatters: false,
            show: true,
            sizeAdjust: 1,
//            tooltipFormatString: '%f, %f, %s',
        // customize the tooptip string: http://www.jqplot.com/docs/files/plugins/jqplot-highlighter-js.html#$.jqplot.Highlighter.formatString
        // it only works well when useAxesFormatters is false!!!!!!
            formatString:'<table class="jqplot-highlighter">'+
      '<tr><td>Age:</td><td>%d</td></tr>'+
      '<tr><td>volume:</td><td>%.5f</td></tr>'+
        // if useAxesFormatters: true, the data point values will be rounded to the grid values, so don't use it, use your own formmat to show the data!!!!
      '<tr><td>ID:</td><td>%s</td></tr>'
},
        cursor: {
            show: false
        }
    });
    /* */

}
function resetposition()
{
    for (var i=0;i < allnew2dViews.length;i++)
    {
        allnew2dViews[i].resetposition();
    }
}
function resetpositionfirsttimeloading(obj)
{
    if (obj.firsttimeloading)
    {
        obj.view.resetposition();
    }
}
function plotROIvolumes(roiname, keyword)
{
    var points = [];
    var age;
    var volume;
    var ele = roivolumesDom.getElementsByTagName(roiname);
    for (var i = 0; i <  ele[0].children.length; i ++)
    {
        var c = ele[0].children[i];
        for (var j = 0; j <  c.children.length; j ++)
        {
            if (c.children[j].tagName == 'age')
            {
                age = parseFloat(c.children[j].textContent);
            }
//            if (c.children[j].tagName == 'volume')
            if (c.children[j].tagName == keyword)
            {
                volume = parseFloat(c.children[j].textContent);
            }
        }
        points.push([age, volume]);
    }
    var plotparas = {
        points: points,
        title: roiname,
        xlabel: "Age",
        ylabel: keyword
    }
    PlotVolumeData('VolumePlot',plotparas);
/*    // must have bracket to plot point pairs!!!!!!!!!
    $('#VolumePlot').empty()
        .height(300)
        .width(500);
    plot1 = $.jqplot ('VolumePlot', [points],{
        animateReplot: true,
        title:roiname,
        // must use series to specify properties of lines, even when only one line to draw!!!!!!
        series:[
            {
                showLine:false
//                    markerOptions: { size: 7, style:"x" }
            }
        ],
        axes:{
            xaxis:{
                label:'Age'
            },
            yaxis:{
                label:keyword
            }
        }
    });
*/
}

   // see this: http://javascript.about.com/library/blxhtml.htm
   // have to add /* <![CDATA[ */ and  /* ]]> */ around javascript code!!!!!!!
   /* <![CDATA[ */
   var configs = null;
   var rois = null;
   var AxisView = null;
   var subjectdemography = null;
//   var nodes = nodes1;
   var nodes = null;
    var mousedown = false;

//   var roivolumesDom;

	var treetype;
   var treelevel = 1;
   var pageenv = 'static';
   // variable for dynamic pages:
   var jobid = 12;

    function zeroFill( number, width )
    {
        width -= number.toString().length;
        if ( width > 0 )
        {
            return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
        }
        return number + ""; // always return a string
    }
    window.onload = function ()
    {
//        document.getElementById("BSColor").checked = true;
//        document.getElementById("05").checked = true;
        // obsolete, will not use xml file in the future
/*        var volumexmlrequest = initXmlHttpRequest();
//        volumexmlrequest.open("GET","XinAtlasRoisurfacesYue/normalvolumes.xml",true);
        volumexmlrequest.open("GET","XinAtlasRoisurfacesYue2/ElderPercent.xml",true);
        volumexmlrequest.send();
        volumexmlrequest.onreadystatechange = function()
        {
            if (this.readyState==4 && this.status==200)
            {
                // upon received, update the color in all the views
//                roivolumesDom = this.responseXML.documentElement;
            }
        };
*/

    };

    function slidemouseUp()
    {
//        updateimages();
    }



     function externalpage()
    {
        var itable = document.getElementById("rightpagetable");
        var jtable = itable;
    }
   function loadpdf()
   {
       var pdf = new PDFObject({
           url: ""

       }).embed("leftpage");
   }

    function zoomin()
    {
        for (var i=0;i < allnew2dViews.length;i++)
        {
            allnew2dViews[i].zoomin();
        }
    }

    function zoomout()
    {
        for (var i=0;i < allnew2dViews.length;i++)
        {
            allnew2dViews[i].zoomout();
        }
    }
/*   function choosetree()
   {
       if (document.getElementById("Tree1").checked == true)
       {
            // Now get the root node object
           var rootNode = $("#tree").dynatree("getRoot");
           rootNode.removeChildren();
           // Call the DynaTreeNode.addChild() member function and pass options for the new node
           var childNode = rootNode.addChild(nodes1);
           expandtreetolevel(1);
           brain3d.RemoveAllRois();
           treetype = 1;
           nodes = nodes1;


       }
       if (document.getElementById("Tree2").checked == true)
       {
           // Now get the root node object
           var rootNode = $("#tree").dynatree("getRoot");
           rootNode.removeChildren();
           // Call the DynaTreeNode.addChild() member function and pass options for the new node
           var childNode = rootNode.addChild(nodes2);
           expandtreetolevel(1);
           brain3d.RemoveAllRois();
           treetype = 2;
           nodes = nodes2;
       }
       $("#checksurface").prop('checked', false);
       // update roicolor

		$.ajax({
            type: "GET",
            url: configs.general.data_path+"T"+treetype+"_roicolors.xml",
            success: function (data) {
				ajaxcolorrequestsuccess(data);
            }
        });	   
	   
       for (var i=0;i < allnew2dViews.length;i++)
       {
           allnew2dViews[i].currenttreetype = treetype;
           allnew2dViews[i].updateimages();
       }

   }
*/   
   function expandtreetolevel(level)
   {
       // first unexpand the tree
       $("#tree").dynatree("getRoot").visit(function(node){
           node.expand(false);
       });
       $("#tree").dynatree("getRoot").visit(function(node){
           // can't use left arrow as less than must use lt;
           if ( node.getLevel() <  level + 1 )
           {
               node.expand (true);
           }
       });
   }
   function showhidesurfaces()
   {
       $("#tree").dynatree("getRoot").visit(function(node)
       {
           node.select(false);
       });
       if (document.getElementById("checksurface").checked == true)
       {
           // first unexpand the tree
           $("#tree").dynatree("getRoot").visit(function(node){
               // can't use left arrow as less than must use lt;
               if ( node.getLevel() == treelevel+1)
               {
                   node.select(true);
               }
           });
       }
   }

   /* ]]> */
function setlevelselectors(mlevel)
{
	$("#tree_level_selectors").empty();
	$("#tree_level_selectors").append('Expand ROIs at Level');
	for (var i = 0; i < mlevel ;  i ++)
	{
		jQuery('<input/>', {
			type: 'radio',
			name: 'treelevelselection',
			value: i,
			// set the initial selection
			checked: (i==0)?true:false
		})
		.change(	function(){
			if ($(this).is(':checked'))
			{
				treelevel = parseInt($(this).attr('value'));
				expandtreetolevel(treelevel);
				for (var i=0;i < allnew2dViews.length;i++)
			   {
				   allnew2dViews[i].currentlevel = treelevel;
				   allnew2dViews[i].updateimages();
			   }				
			}
			
		})
		.appendTo('#tree_level_selectors');
		$('#tree_level_selectors').append(i);
	}
	
}

function	setroisbycurrenttree(currenttree)
{
	var roinamesjson = currenttree.path + currenttree.roinamejson;
	$.getJSON( roinamesjson, function( data ) {
		rois = data;
	});				
}

function initializeroitree()
{
	var currenttree = find_in_array_by_id(configs.roitree_options, configs.roitrees.default);
	var roitreejson = currenttree.path + currenttree.roijson;
	jQuery('<div/>', {
		id: 'tree_selector',
		text: 'TreeView: '
	}).appendTo('#treecontrolpanelcontainer');
	jQuery('<div/>', {
		id: 'tree_level_selector_container'
	}).appendTo('#treecontrolpanelcontainer');
	// the div element to be reset when tree type is changed.
	jQuery('<div/>', {
		id: 'tree_level_selectors'
	})
	.appendTo('#tree_level_selector_container');
	jQuery('<input/>', {
		type: 'checkbox',
		id: 'checksurface',
	}).change(function(){
		showhidesurfaces();
	})
	.appendTo('#treecontrolpanelcontainer');
	
	$('#treecontrolpanelcontainer').append('show/hide all 3D surfaces at this level');
	$('#treecontrolpanelcontainer').append('<br>');


	
	$.getJSON( roitreejson, function( treejsondata ) {
		$("#tree").dynatree({
                    // replace .title with .idname
                    onActivate: function(node) {
                    // A DynaTreeNode object is passed to the activation handler
                    // Note: we also get this event, if persistence is on, and the page is reloaded.
//                        alert("You activated " + node.data.title);
//                        alert("You activated " + node.data.tag);
                        MouseDownROI = parseInt(node.data.tag);
                        node.select(true);
                        brain3d.HightlightRoi(node.data.idname);
//                        drawROI(MouseDownROI);
					},
					onSelect: function(flag, node) { //for check/uncheck the folder
						if (flag)
						{
							// alert("You selected " + node.data.title);
							// there should be no space in the .title for jquery search!!!!!!!! otherwise
							// use idname to include level information
							brain3d.AddRoi(node.data.idname);
						}else
						{
							// alert("You deselected " + node.data.title);
							brain3d.RemoveRoi(node.data.idname)
						}
					},
					minExpandLevel: 1,
					title: "Brain",
					isFolder: true,
					children: treejsondata,
					checkbox: true, // Show checkboxes.
					selectMode: 2 // 1:single, 2:multi, 3:multi-hier
        });
		var mlevels = $("#tree").dynatree("getTree").getMaxLevel();
		setlevelselectors(mlevels);
		treetype = 1;
		expandtreetolevel(1);
	});	
	
	setroisbycurrenttree(currenttree);
/*	var roinamesjson = currenttree.path + currenttree.roinamejson;
	$.getJSON( roinamesjson, function( data ) {
		rois = data;
	});
*/
	
	for (var i=0;i < configs.roitree_options.length;i++)
	{
		jQuery('<input/>', {
			type: 'radio',
			name: 'treetypeselection',
			value: i,
			// initial selection
			checked: (i===0)?true:false
		})
		.change(	function(){
			if ($(this).is(':checked'))
			{
				var currenttree = find_in_array_by_id(configs.roitree_options, configs.roitrees.trees[$(this).attr('value')]);
				var roitreejson = currenttree.path + currenttree.roijson;
			   treetype = parseInt($(this).attr('value')) + 1;
				$.getJSON( roitreejson, function( treejsondata ) {
					// Now get the root node object
				   var rootNode = $("#tree").dynatree("getRoot");
				   // reset the tree node
				   rootNode.removeChildren();
				   // Call the DynaTreeNode.addChild() member function and pass options for the new node
				   rootNode.addChild(treejsondata);
				   expandtreetolevel(1);
				   // clear the 3d view
				   brain3d.RemoveAllRois();
				   nodes = treejsondata;
					var mlevels = $("#tree").dynatree("getTree").getMaxLevel();
					setlevelselectors(mlevels);
				});
				setroisbycurrenttree(currenttree);
			}
		   $("#checksurface").prop('checked', false);
		   // update roicolor
			$.ajax({
				type: "GET",
				url: configs.general.data_path+"T"+treetype+"_roicolors.xml",
				success: function (data) {
					ajaxcolorrequestsuccess(data);
				}
			});	
			for (var j=0;j < allnew2dViews.length;j++)
			{
			   allnew2dViews[j].currenttreetype = treetype;
			   allnew2dViews[j].updateimages();
		   }	
			
		})
		.appendTo('#tree_selector');
		var currenttree = find_in_array_by_id(configs.roitree_options, configs.roitrees.trees[i]);
		$('#tree_selector').append(currenttree.title);		
	}
	
	
}
function find_in_array_by_id( arr, id  )
{
	var result = $.grep(arr, function(e){ return e.id == id; });
		if (result.size == 0) 
		{
			console.log("error: cannot find element with id: "+id);
		}
		
	return result[0];
}
function ajaxcolorrequestsuccess(data)
{
	// upon received, update the color in all the views
	for (var i=0;i < allnew2dViews.length;i++)
	{
		// for the responseXML is null error:
		// http://www.sencha.com/forum/showthread.php?27600-AJAX-returns-responseText-but-no-responseXML
		// XHR always returns responseText regardless of the content-type.
		// To get a valid XMLDoc object (for browser especially) you must specify a
		//  response Content-Type: text/xml or every browser WILL NOT create an XML object for you.
		// if content type is not text or xml, the browser will failed to interpret it
		// in short at the server end when sending xml file to client, must use 'Content-Type: text/xml' in header!!!!
		allnew2dViews[i].RoiColorDom = data;
		allnew2dViews[i].ColorsReady = true;
//                    console.log("colorxmlhttp received");
		// color must be rendered when both shapes and colors are loaded
		if (allnew2dViews[i].ContoursReady)
		{
//			console.log("ContoursReady ready");
			allnew2dViews[i].setroicolorsfromxml(roifillalpha);
		}
	}
}

// merge two objects, result has with the properties from both
function mergeobjects(obj1,obj2)
{
	var obj = obj1;
	for (var key in obj2) {
	  if (obj2.hasOwnProperty(key)) 
	  {
			obj[key] = obj2[key];
	  }
	}
	return obj;	
}
function InitializeLayout(data)
{
	
	console.log(data);
	configs = data;
	initializeroitree();
	var view;
	for (var i in configs.views)
	{
		var view = new LayeredBrainView2Dnew(
		{
			config: mergeobjects(configs.views[i],configs.general),
			options: configs.view_options
		});
	}
	
	// have to initialize control panel after views, will ready layer information from view objects to determine the controls
	initializecontrolpanel();
	       

	$("#Filters").on("change", ".FilterSetting input", function() {
			/*Caman("#axi_dense_image_canvas_Whole_Brain_T1", function () {
			this.brightness(10).render();
		});*/
            var j, k;
            j = $(this).data("filter");
            k = $(this).val();
			Caman("#axi_dense_image_canvas_Whole_Brain_T1", function () {
			this.brightness(k).render();
		});
            b[j] = k;
            $(this).find("~ .FilterValue").html(k);
            return a()
        });
	/*Caman("#axi_dense_image_canvas_Whole_Brain_T1", function () {
					this.brightness(100).render();
				});
		*/		
	var linkprefix = configs.general.data_path;
	// read the demography data
	$.getJSON( linkprefix+"demography.json", function( data ) {
		subjectdemography = data;
		console.log( "demography.json loaded successfully" );
	});
	brain3d = new BrainView3D(
			{
				container: "root3d",
				controlcontainer: "3dcontrolpanelcontainer",
				resetviewbuttonId: "resetviewbutton",
				linkprefix: linkprefix,
				V1Id: "V1",
				V2Id: "V2",
				V3Id: "V3"
			}
	);


	
	
}

function hidelayersinallnews( indx )
{
	for (var i = 0; i < allnew2dViews.length; i ++)	
	{
		allnew2dViews[i].layers[indx].hide();
		allnew2dViews[i].layers[indx].draw();
	}
}

function updatesliders( layerindx )
{
	for (var i = 0; i < allnew2dViews.length; i ++)	
	{
		allnew2dViews[i].updateslider(layerindx);
	}	
}
function showlayersinallnews( indx )
{
	for (var i = 0; i < allnew2dViews.length; i ++)	
	{
		allnew2dViews[i].layers[indx].show();
		allnew2dViews[i].layers[indx].draw();
	}
}

function drawcolorbar( canvasid, config)
{
	var $canvas = $("#"+canvasid);
	var canvas = $canvas[0];
	var context = canvas.getContext('2d');
	context.rect(0, 0, canvas.width, canvas.height/2);
	var $ctn = $("#2dcontrolpanelcontainer");
	var ctn = $ctn[0];
	var fontsize = window.getComputedStyle(ctn, null).getPropertyValue('font-size');
	console.log(window.getComputedStyle(ctn, null).getPropertyValue('font'));
	// set the font size to be the same in other part of the page.
//	var tstr = context.font;
	
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
	// have to define regular express in advance not in the replace function!!!!!
	var re = /\d*px/gi ;
//	var newstr = tstr.replace(re,'20px');
	context.font = context.font.replace(re, 'large');

	// add linear gradient
	var grd = context.createLinearGradient(0, 0, canvas.width, canvas.height);
	// light blue
	var steps = config.colors.length - 1;
	var stepsize = 1/steps;
	for (var i = 0; i <= steps ; i ++)
	{
		var position = i * stepsize;
		grd.addColorStop(position, config.colors[i]);
//		http://stackoverflow.com/questions/3697615/how-can-i-write-text-on-a-html5-canvas-element
//		context.fillText(config.values[i], 100, 0);
		context.fillText(config.values[i], position*canvas.width, canvas.height);
	}
	context.fillStyle = grd;
	context.fill();	
}
function initializecontrolpanel()
{
	$('#2dcontrolpanelcontainer').attr('style:', 'background-color:#FFA0AF');
	// create dense image layer selection controls container
	jQuery('<div/>', {
		id: 'dense_selector',
		style: 'background-color:#FFA0AF',
		text: '2D View: select dense image layer'
	}).appendTo('#2dcontrolpanelcontainer');
	// create non dense image layer selection controls container
	jQuery('<div/>', {
		id: 'non_dense_selector',
		style: 'background-color:#FFA0AF',
		text: 'turn on/off other layers'
	}).appendTo('#2dcontrolpanelcontainer');
	// zoom control container 
	jQuery('<div/>', {
		id: 'zoom_control',
		style: 'background-color:#FFA0AF',
		text: 'zoom: '
	}).appendTo('#2dcontrolpanelcontainer');

	
	jQuery('<div/>', {
		id: 'pan_control',
		style: 'background-color:#FFA0AF',
		text: 'To pan: click hold and drag mouse on the image'
	}).appendTo('#2dcontrolpanelcontainer');

	jQuery('<div/>', {
		id: 'brightness_control',
		style: 'background-color:#FFA0AF',
		text: 'Brightness control'
	}).appendTo('#2dcontrolpanelcontainer');
	
	
	// generate slice selectors
	for (var i = 0; i < allnew2dViews.length; i ++)
	{
		jQuery('<div/>', {
			text: allnew2dViews[i].config.display_name,
		}).appendTo('#2dcontrolpanelcontainer');
		var selectorid = allnew2dViews[i].config.id+"slice_selector";
		jQuery('<input/>', {
			id: selectorid,
			type: 'number',
			min:  '1',
			value: allnew2dViews[i].sliderconfig.initial,
			max:  allnew2dViews[i].sliderconfig.max,
			associatedviewindex: i,
		})
		// bind multiple event with one handler
		.bind("change mousewheel", function(){
			var view = allnew2dViews[$(this).attr("associatedviewindex")];
			view.currentslicemastervalue = view.slider_value_to_master( $(this).val(), view.sliderconfig);
			view.updateimages();
			view.slider.setValue($(this).val());
		})

/*		.change(function(){
			var view = allnew2dViews[$(this).attr("associatedviewindex")];
			view.currentslicemastervalue = view.slider_value_to_master( $(this).val(), view.sliderconfig);
			view.updateimages();
			view.slider.setValue($(this).val());
		})
*/		
		.appendTo('#2dcontrolpanelcontainer');
		allnew2dViews[i].slice_selector_id = selectorid;
	}
	
	// add layer controls 
	for (var i = 0; i < allnew2dViews[0].layers.length; i ++)
	{
		var itype = allnew2dViews[0].layers[i].image_type;
		// this is how you define a variable of jquery object
		var $c;
		switch ( itype )
		{
			case 'dense':
			// dense image layers are exclusive to each other
				$c = jQuery('<input/>', {
					layerindx: i,
					type: 'radio',
					name: 'resolution'
				})
				.change(	function()
				{
					if ($(this).is(':checked'))
					{
						for (var j = 0; j < allnew2dViews[0].layers.length; j ++)
						{
							if ( allnew2dViews[0].layers[j].image_type == 'dense' )
							{
								if (j == $(this).attr('layerindx'))
								{
									showlayersinallnews(j);
									updatesliders($(this).attr('layerindx'));
								}else 
								{
									hidelayersinallnews(j);
								}
							}
						}
//					  alert('checked');
					}else
					{
					// it doesn't sense the uncheck event of radio button!!!!!!!
//						  alert('unchecked');
					};
				})
				.appendTo('#dense_selector');				
				$('#dense_selector').append('<span>'+allnew2dViews[0].layers[i].display_name);
				
				// initial value: only show the first layer in all dense images
				if (i == 0)
				{
					// set the check property of radio button
					$c.prop( 'checked', true );
					showlayersinallnews($c.attr('layerindx'));
				}else
				{
					$c.prop( 'checked', false );
					hidelayersinallnews($c.attr('layerindx'));
				}
				break;
			case 'contour':
			case 'grid':
			// 	create checkboxes for other layers
				$c = jQuery('<input/>', {
					type: 'checkbox',
					layerindx: i
				})
				.change( function(){
					if ($(this).is(':checked'))
					{
						showlayersinallnews($(this).attr('layerindx'));

					}else
					{
						hidelayersinallnews($(this).attr('layerindx'));
					};
				})
				.appendTo('#non_dense_selector')
				$('#non_dense_selector').append(allnew2dViews[0].layers[i].display_name);
				// set initial value, show contour, hide grid
				if (itype === 'grid')
				{
					$c.prop( 'checked', false );
					hidelayersinallnews($c.attr('layerindx'));
				}else
				{
					$c.prop( 'checked', true );
					showlayersinallnews($c.attr('layerindx'));
				}
					
					

				break;
		}
	}
	$('#non_dense_selector').append('<br>');
	
	jQuery('<input/>', {
		type: 'checkbox',
		id: 'checkroicolor',
		checked: true
	}).change(function(){
		if ($(this).is(':checked'))
		{
			roifillalpha = defaultroifillalpha;
		}else
		{
			roifillalpha = 0.0;
		}
		for (var i=0;i < allnew2dViews.length;i++)
		{
			allnew2dViews[i].setroicolorsfromxml(roifillalpha);
		}
	})
	.appendTo('#non_dense_selector');
	$('#non_dense_selector').append('show/hide roi colors in the 2D views');

	
	
	// add zoom controls 
	jQuery('<button/>', {
		type: 'button',
		text: '+'
	}).click(function (){ zoomin(); })
	.appendTo('#zoom_control');
	jQuery('<button/>', {
		type: 'button',
		text: '-'
	}).click(function (){ zoomout(); })
	.appendTo('#zoom_control');
	jQuery('<button/>', {
		type: 'button',
		text: 'Reset'
	}).click(function (){ resetposition(); })
	.appendTo('#zoom_control');
//	allnew2dViews[0].layers[0].image_type;

	// draw colorbar only when it's specified
	if (typeof configs.general.colorbar != "undefined")
	{
		jQuery('<canvas/>', {
			id: 'colorbarcanvas',
			height: '50',
			width: '400'
		}).appendTo('#2dcontrolpanelcontainer');
		drawcolorbar( 'colorbarcanvas', find_in_array_by_id(configs.colorbar_options, configs.general.colorbar));
	}
}