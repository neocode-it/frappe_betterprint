
def html_wrapper(body: str, style: str) -> str:
    return f"""
    <!DOCTYPE html>
        <head>
            <meta charset="UTF-8">
            <title>PRINT</title>
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
                {style}
            </style>
        </head>
        <body>
            <div class="print-format-gutter">
                <div class="print-format" style="max-height: unset !important">
                    {body}
                </div>
            </div>
        </body>
    </html> 
    """


def page_break() -> str:
    return """
    <div class="bp-pagebreak"><p>Page Break</p></div>
    <style>
        .bp-pagebreak{
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            
            background-image: linear-gradient(to right, #787575 70%, white 0%);
            background-position: center;
            background-size: 15px 1px;
            background-repeat: repeat-x;
        }
        .bp-pagebreak p{
            font-size: 13px;
            color: #787575;
            padding: 0px 20px;
            background-color: white;
        }

        @media print {
            .bp-pagebreak{
                page-break-before: always;
                overflow: hidden;
                height: 0px;
            }
        }
    </style>
    """

